const rawAdminPath = (process.env.REACT_APP_ADMIN_PATH || '/control-x9k2p').trim();

export const ADMIN_PATH = rawAdminPath.startsWith('/') ? rawAdminPath : `/${rawAdminPath}`;

export default ADMIN_PATH;
