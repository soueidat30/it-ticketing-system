import { RoleLanguageProvider } from "../contexts/RoleScopedLanguageContext";

export default function RoleLanguageWrapper({ role, children }) {
  return <RoleLanguageProvider role={role}>{children}</RoleLanguageProvider>;
}

