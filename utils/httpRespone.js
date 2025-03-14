export const SUCCESS = "success";
export const ERROR = "error";

export function goodResponse(code, data, massage, newToken) {
    let httpResponse = {
        status: SUCCESS,
        code: code,
        data: data,
        newAccessToken: newToken ? newToken : null,
        massage: massage,
    };
    return httpResponse;
}

export function badResponse(code, massage) {
    let httpResponse = {
        status: ERROR,
        code: code,
        massage: massage,
        data: null,
    };
    return httpResponse;
}
