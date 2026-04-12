/**
 * RentCast API service
 * Docs: https://developers.rentcast.io/reference/api-overview
 */

import { logger } from "@/lib/utils/logger";

const BASE_URL = "https://api.rentcast.io/v1";
const API_KEY = process.env.RENTCAST_API_KEY ?? "";

export interface RentCastProperty {
  id?: string;
  formattedAddress: string;
  addressLine1: string;
  city: string;
  state: string;
  zipCode: string;
  county?: string;
  latitude?: number;
  longitude?: number;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  lotSize?: number;
  yearBuilt?: number;
  stories?: number;
  garage?: number;
  assessedValue?: number;
  lastSalePrice?: number;
  lastSaleDate?: string;
  ownerOccupied?: boolean;
}

export interface RentCastAVM {
  price: number;
  priceRangeLow: number;
  priceRangeHigh: number;
  latitude?: number;
  longitude?: number;
  comparables?: RentCastComp[];
}

export interface RentCastComp {
  id: string;
  formattedAddress: string;
  price: number;
  squareFootage?: number;
  bedrooms?: number;
  bathrooms?: number;
  correlation: number;
  distance: number;
  listedDate?: string;
  removedDate?: string;
  daysOnMarket?: number;
}

/**
 * Look up property data by address.
 * Returns null if API key not configured or address not found.
 */
export async function lookupProperty(address: string): Promise<RentCastProperty | null> {
  if (!API_KEY) {
    logger.warn("rentcast.lookup.skipped", { reason: "no API key" });
    return null;
  }

  try {
    logger.info("rentcast.lookup.start", { address });
    const url = `${BASE_URL}/properties?address=${encodeURIComponent(address)}&limit=1`;
    const res = await fetch(url, {
      headers: { "X-Api-Key": API_KEY },
      next: { revalidate: 3600 }, // cache 1h
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      logger.warn("rentcast.lookup.failed", { status: res.status, body });
      return null;
    }

    const data = await res.json();
    const property: RentCastProperty = Array.isArray(data) ? data[0] : data;
    if (!property?.formattedAddress) return null;

    logger.info("rentcast.lookup.success", { address: property.formattedAddress });
    return property;
  } catch (err) {
    logger.error("rentcast.lookup.error", { address, error: String(err) });
    return null;
  }
}

/**
 * Get AI estimated value + comparables for a property.
 */
export async function getAVM(address: string): Promise<RentCastAVM | null> {
  if (!API_KEY) {
    logger.warn("rentcast.avm.skipped", { reason: "no API key" });
    return null;
  }

  try {
    logger.info("rentcast.avm.start", { address });
    const url = `${BASE_URL}/avm/value?address=${encodeURIComponent(address)}&propertyType=Single+Family&compCount=5`;
    const res = await fetch(url, {
      headers: { "X-Api-Key": API_KEY },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      logger.warn("rentcast.avm.failed", { status: res.status, body });
      return null;
    }

    const data: RentCastAVM = await res.json();
    logger.info("rentcast.avm.success", {
      address,
      price: data.price,
      comps: data.comparables?.length ?? 0,
    });
    return data;
  } catch (err) {
    logger.error("rentcast.avm.error", { address, error: String(err) });
    return null;
  }
}
