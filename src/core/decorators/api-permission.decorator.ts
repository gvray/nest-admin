export type ApiPermissionDef = {
  code: string;
  parentMenuCode: string;
  name?: string;
  description?: string;
};

export const API_PERMISSION_REGISTRY: ApiPermissionDef[] = [];

export function ApiPermission(
  code: string,
  parentMenuCode: string,
  name?: string,
  description?: string,
) {
  return function () {
    API_PERMISSION_REGISTRY.push({ code, parentMenuCode, name, description });
  };
}
