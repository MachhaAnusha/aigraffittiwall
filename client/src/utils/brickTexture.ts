export const BRICK_TEXTURE_CSS =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='60' viewBox='0 0 120 60'%3E%3Cg fill='%23333' fill-opacity='0.15'%3E%3Crect x='0' y='0' width='56' height='24' rx='1'/%3E%3Crect x='60' y='0' width='56' height='24' rx='1'/%3E%3Crect x='30' y='28' width='56' height='24' rx='1'/%3E%3Crect x='0' y='28' width='26' height='24' rx='1'/%3E%3Crect x='90' y='28' width='26' height='24' rx='1'/%3E%3C/g%3E%3C/svg%3E\")";

export const BRICK_BACKGROUND_STYLE = {
  backgroundImage: BRICK_TEXTURE_CSS,
  backgroundSize: '120px 60px',
} as const;
