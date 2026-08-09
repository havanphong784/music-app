export interface IPaginationOptions {
    page: number;
    limit: number;
    skip: number;
    take: number;
}

export interface IPaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export const parsePagination = (query: any, defaultLimit = 10, maxLimit = 100): IPaginationOptions => {
    const page = Math.max(1, parseInt(query?.page as string) || 1);
    const limit = Math.min(maxLimit, Math.max(1, parseInt(query?.limit as string) || defaultLimit));
    const skip = (page - 1) * limit;
    const take = limit;
    return {page, limit, skip, take};
};

export const buildPaginationMeta = (total: number, page: number, limit: number): IPaginationMeta => {
    return {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
};
