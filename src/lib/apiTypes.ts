export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
}

export interface GenerateStoryResult extends ApiResponse<{
    story?: string;
    filteredMessageCount?: number;
}> { }