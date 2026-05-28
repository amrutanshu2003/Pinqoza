const rawSuccessPath = (process.env.REACT_APP_SUCCESS_PATH || '/order-confirm-x7a9k').trim();

export const SUCCESS_PATH = rawSuccessPath.startsWith('/') ? rawSuccessPath : `/${rawSuccessPath}`;

export default SUCCESS_PATH;
