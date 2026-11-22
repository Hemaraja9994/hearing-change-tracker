/* Hearing Change Tracker: a one-minute monthly self-check. Six everyday questions, an optional
   TV-volume number, a trend against the first months, and a chart. Four languages. On-device. */
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Ear, TrendingUp } from "lucide-react";
import { AppShell, type Section } from "@/shell/AppShell";
import { Button, Callout, Field, Input, Panel, ResponsiveTable, Segmented, Select, cx } from "@/shell/ui";
import { LineChart } from "@/shell/LineChart";
import { References } from "@/shell/References";
import { usePersistent } from "@/shell/storage";
import { toast } from "@/shell/toast";
import { downloadCSV, fmtDate, todayISO, uid } from "@/shell/lib";
import { MAX_SCORE, QS, status, type Check, type Lang } from "./tracker";
import refs from "./refs.json";

export default function App() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as Lang;
  const [view, setView] = useState("check");
  const [log, setLog] = usePersistent<Check[]>("hct-log", []);
  const [ans, setAns] = useState<Record<number, number>>({});
  const [tv, setTv] = useState("");
  const [who, setWho] = useState("self");
  const [err, setErr] = useState("");

  const st = useMemo(() => status(log), [log]);
  const sorted = useMemo(() => [...log].sort((a, b) => a.date.localeCompare(b.date)), [log]);

  const sections: Section[] = [{ id: "check", label: t("checkTitle"), icon: Ear }, { id: "history", label: t("histTitle"), icon: TrendingUp }];
  const go = (id: string) => { setView(id); window.scrollTo({ top: 0 }); };

  const setA = (q: number, v: number) => setAns(a => ({ ...a, [q]: v }));
  const save = () => {
    if (Object.keys(ans).length < QS.length) { setErr(t("need")); return; }
    setErr("");
    const score = Object.values(ans).reduce((s, v) => s + v, 0);
    setLog(l => [...l, { id: uid(), date: todayISO(), score, answers: { ...ans }, tv: tv === "" ? null : Number(tv), who }]);
    setAns({}); setTv(""); toast(t("saved")); go("history");
  };
  const del = (id: string) => { setLog(l => l.filter(x => x.id !== id)); toast(t("saved")); };
  const csv = () => downloadCSV([["date", "score_0_12", "tv_volume", "answered_by", ...QS.map((_, i) => "q" + (i + 1))],
    ...sorted.map(x => [x.date, x.score, x.tv ?? "", x.who, ...QS.map((_, i) => x.answers[i])])], `hearing-change-${todayISO()}.csv`);

  const opt = [{ v: 0, k: "never" }, { v: 1, k: "sometimes" }, { v: 2, k: "often" }] as const;

  return (
    <AppShell title={t("appName")} subtitle={t("appSub")} sections={sections} active={view} onSection={go}
      footer={<p className="m-0">{t("disclaimer")}</p>}>
      <div className="mx-auto grid max-w-2xl gap-5">
        <header><h2 className="m-0 text-xl font-bold">{t("h2")}</h2><p className="m-0 mt-1 text-muted">{t("intro")}</p></header>

        <Callout tone={st.tone} title={t("statusTitle")}>{t(st.k)}</Callout>

        {view === "check" && (
          <>
            <Panel title={t("checkTitle")}>
              <p className="m-0 text-[0.95rem] text-muted">{t("checkIntro")}</p>
              <ol className="m-0 mt-2 grid list-none gap-4 p-0">
                {QS.map((q, i) => (
                  <li key={i}>
                    <p className="m-0 mb-1.5 text-[0.98rem] font-medium">{q[lang] ?? q.en}</p>
                    <Segmented label={q[lang] ?? q.en} value={ans[i]} onChange={v => setA(i, v)} options={opt.map(o => ({ value: o.v, label: t(o.k) }))} />
                  </li>
                ))}
              </ol>
              <Field label={t("tvVol")} hint={t("tvHint")}>{id => <Input id={id} type="number" inputMode="numeric" min={0} max={100} value={tv} onChange={e => setTv(e.target.value)} className="max-w-32" />}</Field>
              <Field label={t("who")}>{id => <Select id={id} value={who} onChange={e => setWho(e.target.value)} className="max-w-48"><option value="self">{t("self")}</option><option value="family">{t("family")}</option></Select>}</Field>
              {err && <p role="alert" className="m-0 mt-2 font-semibold text-high">{err}</p>}
              <div className="mt-4"><Button variant="primary" onClick={save}>{t("save")}</Button></div>
            </Panel>
            <References refs={refs} contextQuery={st.k === "high" || st.k === "change" ? "hearing test audiologist early difficulty noise" : "gradual hearing loss monthly check"} contextLabel="Why this matters" />
          </>
        )}

        {view === "history" && (
          <>
            <Panel title={t("histTitle")} action={<Button size="sm" onClick={csv} disabled={!log.length}>CSV</Button>}>
              {sorted.length >= 2 ? (
                <LineChart yMin={0} yLabel={`${t("score")} (0–${MAX_SCORE})`}
                  series={[{ label: t("score"), color: "var(--color-accent)", points: sorted.map(x => ({ x: new Date(x.date + "T12:00"), y: x.score })) },
                    ...(sorted.some(x => x.tv != null) ? [{ label: t("tv"), color: "var(--color-mid)", points: sorted.filter(x => x.tv != null).map(x => ({ x: new Date(x.date + "T12:00"), y: x.tv as number })) }] : [])]}
                  dateLabel={d => fmtDate(d, lang, { month: "short", year: "2-digit" })} />
              ) : <p className="m-0 text-muted">{log.length ? "Save another month to see a chart." : t("first")}</p>}
              <div className="mt-4">
                <ResponsiveTable rows={[...sorted].reverse()} rowKey={x => x.id} empty={t("first")}
                  columns={[
                    { header: t("date"), cell: x => fmtDate(x.date, lang) },
                    { header: `${t("score")} (0–${MAX_SCORE})`, cell: x => <b className={cx(x.score >= 7 && "text-high")}>{x.score}</b>, className: "tabular-nums" },
                    { header: t("tv"), cell: x => x.tv ?? "–", className: "tabular-nums" },
                    { header: "", cell: x => <Button size="sm" variant="danger" onClick={() => del(x.id)}>✕</Button> }]} />
              </div>
            </Panel>
            <Callout tone="info" title={t("testTitle")}>{t("testText")}</Callout>
          </>
        )}
      </div>
    </AppShell>
  );
}
