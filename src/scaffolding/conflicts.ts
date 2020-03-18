// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export interface OverwriteResult {
    type: 'overwrite';
}

export interface RenameResult {
    type: 'rename';
    name: string;
}

export interface SkipResult {
    type: 'skip';
}

export type ConflictResult = OverwriteResult | RenameResult | SkipResult;

export type ConflictUniquenessPredicate = (name: string) => Promise<boolean>;

export type ConflictHandler = (name: string, isUnique: ConflictUniquenessPredicate) => Promise<ConflictResult>;
