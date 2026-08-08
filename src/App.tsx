import { AppShell } from "@/components/app-shell";
import { ReturnView } from "@/features/return-review/components/return-view/return-view";
import { RETURNS } from "@/features/return-review/model/returns";

function App() {
  const taxReturn = RETURNS[0];

  return (
    <AppShell
      activeNav="Returns"
      title={`${taxReturn.client} · ${taxReturn.taxYear} Return`}
    >
      <ReturnView return={taxReturn} />
    </AppShell>
  );
}

export default App;
