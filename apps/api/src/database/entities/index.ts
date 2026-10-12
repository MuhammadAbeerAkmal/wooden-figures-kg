import { ConditionReport, Figure } from './figure.js';
import { Collection, Material, ObjectType, Period, Site } from './vocabulary.js';

export * from './figure.js';
export * from './vocabulary.js';

export const ENTITIES = [Figure, ConditionReport, Material, ObjectType, Period, Site, Collection];
