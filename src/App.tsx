import { AppShell } from "@/components/layout/app-shell/app-shell";
import { ReturnReview } from "@/features/return-review/components/return-review/return-review";
import { RETURNS } from "@/features/return-review/model/returns";

function App() {
  const taxReturn = RETURNS[0];

  return (
    <AppShell
      activeNav="Returns"
      title={`${taxReturn.client} · ${taxReturn.taxYear} Return`}
    >
      <ReturnReview return={taxReturn} />
    </AppShell>
  );
}

export default App;
