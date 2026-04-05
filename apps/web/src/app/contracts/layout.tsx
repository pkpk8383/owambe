export default function ContractsLayout({ children }: { children: React.ReactNode }) {
  // No dashboard nav — signing page is public-facing, accessed via email link
  return <>{children}</>;
}
