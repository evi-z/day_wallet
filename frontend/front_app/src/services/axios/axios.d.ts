import axios from 'axios'

const ApiResponse = async (
    response: AxiosResponse<ResponseResults | ResponsePaginatedList>,
): Promise<ResponseResults | ResponsePaginatedList> => {
    return response.data;
};

export default ApiResponse
