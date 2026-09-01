export function handleUnauthenticatedResponse(response: Response): boolean {
  if (response.status !== 401) return false;

  window.location.assign("/login");
  return true;
}
