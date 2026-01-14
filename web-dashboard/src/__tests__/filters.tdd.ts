import type { FilterParams, OccupancyBusRow } from '../types';

type Assert<T extends true> = T;
type IsBusIdArray = FilterParams['bus_id'] extends string[] ? true : false;
type HasPlant = 'plant' extends keyof OccupancyBusRow ? true : false;

export const _busIdIsArray: Assert<IsBusIdArray> = true;
export const _occupancyHasPlant: Assert<HasPlant> = true;
