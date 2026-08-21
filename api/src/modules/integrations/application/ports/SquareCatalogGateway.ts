export type SquareBatchUpsertResult = {
  idMappings: Array<{
    clientObjectId: string | null;
    objectId: string | null;
  }>;
  rawResponse: unknown;
};

export type SquareBatchDeleteResult = {
  deletedAt: string | null;
  deletedObjectIds: string[];
};

export type SquareBatchRetrieveResult = {
  objects: unknown[];
  relatedObjects: unknown[];
};

export type SquareCatalogImageCreateResult = {
  imageId: string | null;
  rawResponse: unknown;
};

export type SquareCatalogGateway = {
  batchUpsertCatalogObjects(input: {
    accessToken?: string;
    idempotencyKey: string;
    objects: unknown[];
  }): Promise<SquareBatchUpsertResult>;
  batchDeleteCatalogObjects?(input: {
    accessToken?: string;
    objectIds: string[];
  }): Promise<SquareBatchDeleteResult>;
  batchRetrieveCatalogObjects(input: {
    accessToken?: string;
    includeRelatedObjects?: boolean;
    objectIds: string[];
  }): Promise<SquareBatchRetrieveResult>;
  createCatalogImageFromUrl(input: {
    accessToken?: string;
    caption?: string;
    imageName?: string;
    imageUrl: string;
    isPrimary?: boolean;
    objectId: string;
  }): Promise<SquareCatalogImageCreateResult>;
};
