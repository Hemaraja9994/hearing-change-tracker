/* Monthly self-check for gradual hearing change. Six everyday questions scored 0 (never),
   1 (sometimes), 2 (often); total 0–12. The status compares the latest month with the first
   months and flags when a hearing test is worth arranging. Not a validated screening tool. */
export type Lang = "en" | "kn" | "te" | "hi";

export const QS: Record<Lang, string>[] = [
  { en: "I ask people to repeat what they said.", kn: "ಜನರು ಹೇಳಿದ್ದನ್ನು ಮತ್ತೆ ಹೇಳಲು ಕೇಳುತ್ತೇನೆ.", te: "ఇతరులు చెప్పినది మళ్లీ చెప్పమని అడుగుతాను.", hi: "मैं लोगों से बात दोहराने को कहता/कहती हूँ।" },
  { en: "I find it hard to follow talk in noisy places, like a wedding or market.", kn: "ಮದುವೆ, ಮಾರುಕಟ್ಟೆಯಂತಹ ಗದ್ದಲದ ಸ್ಥಳಗಳಲ್ಲಿ ಮಾತು ಅರ್ಥವಾಗಲು ಕಷ್ಟ.", te: "పెళ్లి, మార్కెట్ లాంటి గోల ఉన్న చోట్ల మాటలు అర్థం చేసుకోవడం కష్టం.", hi: "शादी या बाज़ार जैसी शोर वाली जगहों पर बात समझना मुश्किल लगता है।" },
  { en: "Family says the TV or phone is too loud.", kn: "ಟಿವಿ ಅಥವಾ ಫೋನ್ ತುಂಬಾ ಜೋರಾಗಿದೆ ಎಂದು ಮನೆಯವರು ಹೇಳುತ್ತಾರೆ.", te: "టీవీ లేదా ఫోన్ చాలా గట్టిగా ఉందని ఇంట్లోవాళ్లు అంటారు.", hi: "घर वाले कहते हैं कि टीवी या फ़ोन बहुत तेज़ है।" },
  { en: "I miss the doorbell, the phone ringing or the cooker whistle.", kn: "ಬಾಗಿಲ ಗಂಟೆ, ಫೋನ್ ರಿಂಗ್ ಅಥವಾ ಕುಕ್ಕರ್ ಸೀಟಿ ಕೇಳಿಸುವುದಿಲ್ಲ.", te: "కాలింగ్ బెల్, ఫోన్ రింగ్ లేదా కుక్కర్ విజిల్ వినిపించదు.", hi: "दरवाज़े की घंटी, फ़ोन की रिंग या कुकर की सीटी छूट जाती है।" },
  { en: "I find it hard to hear on the phone.", kn: "ಫೋನ್‌ನಲ್ಲಿ ಕೇಳಿಸಿಕೊಳ್ಳಲು ಕಷ್ಟ.", te: "ఫోన్‌లో వినడం కష్టం.", hi: "फ़ोन पर सुनना मुश्किल लगता है।" },
  { en: "I avoid gatherings because following conversation is tiring.", kn: "ಮಾತುಕತೆ ಅರ್ಥಮಾಡಿಕೊಳ್ಳುವುದು ದಣಿವಾಗುವುದರಿಂದ ಸಮಾರಂಭಗಳನ್ನು ತಪ್ಪಿಸುತ್ತೇನೆ.", te: "సంభాషణ అర్థం చేసుకోవడం అలసటగా ఉండటంతో సమావేశాలకు దూరంగా ఉంటాను.", hi: "बातचीत समझना थकाने वाला लगता है, इसलिए मैं मिलने-जुलने से बचता/बचती हूँ।" }
];
export const MAX_SCORE = QS.length * 2;

export interface Check { id: string; date: string; score: number; answers: Record<number, number>; tv: number | null; who: string }
export type StatusKey = "first" | "stable" | "change" | "high";
export interface Status { k: StatusKey; tone: "info" | "ok" | "mid" | "high" }

/** Compare the latest check with the first up-to-three checks. */
export function status(log: Check[]): Status {
  if (!log.length) return { k: "first", tone: "info" };
  const sorted = [...log].sort((a, b) => a.date.localeCompare(b.date));
  const last = sorted[sorted.length - 1];
  if (last.score >= 7) return { k: "high", tone: "high" };
  const base = sorted.slice(0, Math.min(3, sorted.length - 1));
  if (base.length) {
    const b = base.reduce((s, x) => s + x.score, 0) / base.length;
    const bt = base.filter(x => x.tv != null);
    const tvUp = bt.length > 0 && last.tv != null && last.tv - bt.reduce((s, x) => s + (x.tv as number), 0) / bt.length >= 3;
    if (last.score - b >= 3 || tvUp) return { k: "change", tone: "mid" };
  }
  return sorted.length < 2 ? { k: "first", tone: "info" } : { k: "stable", tone: "ok" };
}
