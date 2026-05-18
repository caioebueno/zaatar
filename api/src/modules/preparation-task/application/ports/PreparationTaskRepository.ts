export type PreparationTaskModifierItem = {
  completed: boolean;
  id: string;
  modifierGroupItem?: {
    description?: string;
    id: string;
    name: string;
    photo?: {
      id: string;
      url: string;
    };
    price: number;
    translations?: Record<string, Record<string, string>>;
  };
  modifierGroupItemId: string;
};

export type PreparationTaskItem = {
  comments?: string;
  completed: boolean;
  completedAt: string | null;
  completedComments: boolean;
  createdAt: string;
  expectedAt: string | null;
  goalMinutes: number;
  id: string;
  modifiers: PreparationTaskModifierItem[];
  name: string;
  orderId: string;
  preparationTaskStationId: string;
  preparationStepId: string;
  quantity: number | null;
  stationId: string;
};

export type PreparationTaskStationItem = {
  completed: boolean;
  createdAt: string;
  id: string;
  orderId: string;
  station: {
    id: string;
    name: string;
  };
};

export type CreatePreparationTaskStationInput = {
  completed?: boolean;
  id: string;
  orderId: string;
  stationId: string;
};

export type UpdatePreparationTaskStationInput = {
  completed?: boolean;
  id: string;
  stationId?: string;
};

export type CreatePreparationTaskInput = {
  comments?: string | null;
  completed?: boolean;
  completedComments?: boolean;
  expectedAt?: string | null;
  goalMinutes?: number;
  id: string;
  modifiers?: Array<{
    completed?: boolean;
    id: string;
    modifierGroupItemId: string;
  }>;
  preparationTaskStationId: string;
  preparationStepId: string;
  quantity?: number | null;
};

export type UpdatePreparationTaskInput = {
  comments?: string | null;
  completed?: boolean;
  completedComments?: boolean;
  expectedAt?: string | null;
  goalMinutes?: number;
  id: string;
  modifiers?: Array<{
    completed?: boolean;
    id: string;
    modifierGroupItemId: string;
  }>;
  quantity?: number | null;
};

export type PreparationTaskRepository = {
  createCategory(
    input: CreatePreparationTaskStationInput,
  ): Promise<PreparationTaskStationItem>;
  createTask(input: CreatePreparationTaskInput): Promise<PreparationTaskItem>;
  deleteCategory(id: string): Promise<boolean>;
  deleteTask(id: string): Promise<boolean>;
  findCategoryById(id: string): Promise<PreparationTaskStationItem | null>;
  findTaskById(id: string): Promise<PreparationTaskItem | null>;
  listCategories(filter: {
    completed?: boolean;
    orderId?: string;
    stationId?: string;
  }): Promise<PreparationTaskStationItem[]>;
  listTasks(filter: {
    completed?: boolean;
    orderId?: string;
    preparationTaskStationId?: string;
    stationId?: string;
  }): Promise<PreparationTaskItem[]>;
  updateCategory(
    input: UpdatePreparationTaskStationInput,
  ): Promise<PreparationTaskStationItem | null>;
  updateTask(input: UpdatePreparationTaskInput): Promise<PreparationTaskItem | null>;
};
