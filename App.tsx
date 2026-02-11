
import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Trash2, 
  Phone, 
  MessageCircle, 
  Target,
  FileText,
  Table,
  Clock,
  Users,
  Download,
  Settings,
  CheckCheck,
  MoreVertical,
  Scan,
  Save,
  Send,
  X,
  Plus
} from 'lucide-react';
import { Trainee, ExportFormat } from './types';
import { extractNamesFromTranscript } from './services/geminiService';

const App: React.FC = () => {
  const [names, setNames] = useState<Trainee[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [hasEntered, setHasEntered] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [fileName, setFileName] = useState('');
  const [pendingFormat, setPendingFormat] = useState<ExportFormat | 'DOC' | null>(null);

  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('shooting_range_ultra_v15');
    if (saved) setNames(JSON.parse(saved));
    
    const timer = setTimeout(() => {
      setHasEntered(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('shooting_range_ultra_v15', JSON.stringify(names));
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [names]);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = 'ar-EG';
    recognitionRef.current.continuous = false;
    recognitionRef.current.onstart = () => setIsListening(true);
    recognitionRef.current.onresult = async (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      setIsListening(false);
      processTranscript(text);
    };
    recognitionRef.current.onerror = () => setIsListening(false);
    recognitionRef.current.onend = () => setIsListening(false);
    recognitionRef.current.start();
  };

  const processTranscript = async (text: string) => {
    setIsProcessing(true);
    const extracted = await extractNamesFromTranscript(text);
    if (extracted && extracted.length > 0) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
      const newEntries = extracted.map(name => ({
        id: crypto.randomUUID(),
        name: name.trim(),
        timestamp: timeStr
      }));
      setNames(prev => [...prev, ...newEntries]);
    }
    setIsProcessing(false);
  };

  const deleteItem = (id: string) => {
    setNames(prev => prev.filter(n => n.id !== id));
  };

  const saveEdit = () => {
    if (editingId && editValue.trim()) {
      setNames(prev => prev.map(n => n.id === editingId ? { ...n, name: editValue.trim() } : n));
      setEditingId(null);
    }
  };

  const handleExportRequest = (format: ExportFormat | 'DOC') => {
    const defaultName = `كشف_رماية_${new Date().toLocaleDateString('ar-EG').replace(/\//g, '-')}`;
    setFileName(defaultName);
    setPendingFormat(format);
    setShowExportModal(true);
  };

  const confirmExport = () => {
    if (!fileName.trim()) return;
    if (pendingFormat === 'DOC') {
      executeDocExport();
    } else if (pendingFormat) {
      executeFileExport(pendingFormat as ExportFormat);
    }
    setShowExportModal(false);
    setPendingFormat(null);
  };

  const executeDocExport = () => {
    const dateStr = new Date().toLocaleDateString('ar-EG');
    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40' dir='rtl'>
      <head>
        <meta charset='utf-8'>
        <style>
          @page { size: A4; margin: 1.5cm; }
          body { font-family: 'Arial', sans-serif; direction: rtl; padding: 20px; line-height: 1.5; color: #333; }
          .header { border: 3pt double #00a884; padding: 20px; text-align: center; margin-bottom: 35px; background-color: #f9fdfc; }
          .title { font-size: 26pt; font-weight: bold; color: #00a884; margin: 0; text-decoration: underline; }
          .subtitle { font-size: 14pt; color: #444; margin-top: 8px; font-weight: bold; }
          table { border-collapse: collapse; width: 100%; border: 1.5pt solid black; margin-top: 25px; table-layout: fixed; }
          th { background-color: #00a884; color: white; border: 1pt solid black; padding: 15px; font-weight: bold; text-align: center; font-size: 14pt; }
          td { border: 1pt solid black; padding: 12px; text-align: center; font-size: 13pt; vertical-align: middle; word-wrap: break-word; }
          .footer-section { margin-top: 60px; text-align: center; border-top: 1pt solid #ddd; padding-top: 20px; }
          .dev-tag { font-size: 12pt; font-weight: bold; color: #555; margin-bottom: 10px; }
          .contact-link { text-decoration: none; font-weight: bold; padding: 5px; }
          .whatsapp { color: #25D366; }
          .telegram { color: #0088cc; }
          .meta-info { text-align: right; margin-bottom: 10px; font-weight: bold; font-size: 12pt; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">كشف حضور رماية القاهرة</div>
          <div class="subtitle">نظام التسجيل الصوتي الرقمي - نسخة المجندين</div>
        </div>
        <div class="meta-info">بتاريخ: ${dateStr} <br/> إجمالي العدد المقيد: ${names.length}</div>
        <table>
          <thead>
            <tr>
              <th style="width: 10%;">م</th>
              <th style="width: 65%;">الاسم الكامل</th>
              <th style="width: 25%;">الوقت</th>
            </tr>
          </thead>
          <tbody>
            ${names.map((n, i) => `
              <tr>
                <td style="background-color: #fcfcfc;">${i + 1}</td>
                <td style="text-align: right; padding-right: 20px;">${n.name}</td>
                <td>${n.timestamp}</td>
              </tr>`).join('')}
          </tbody>
        </table>
        <div class="footer-section">
          <div class="dev-tag">تم استخراج هذا الكشف آلياً بواسطة نظام تلاشاني الذكي</div>
          <div style="font-size: 11pt;">
            للدعم الفني أو التعديلات: <br/>
            تواصل عبر الواتساب: <a href="https://wa.me/201282735262" class="contact-link whatsapp">01282735262</a> | 
            تواصل عبر التليجرام: <a href="https://t.me/+201282735262" class="contact-link telegram">@Tlashani</a>
          </div>
        </div>
      </body>
      </html>`;
    
    const blob = new Blob(['\ufeff', html], { type: 'application/vnd.ms-word' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const executeFileExport = (format: ExportFormat) => {
    let content = "";
    let mime = "text/plain";
    if (format === ExportFormat.CSV) {
      content = "\ufeffم,الاسم الكامل,وقت التسجيل\n" + names.map((n, i) => `${i+1},${n.name},${n.timestamp}`).join('\n');
      mime = "text/csv;charset=utf-8";
    } else {
      content = "كشف رماية القاهرة\n" + names.map((n, i) => `${i+1}. ${n.name} [${n.timestamp}]`).join('\n');
    }
    const blob = new Blob([content], { type: mime });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!hasEntered) {
    return (
      <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-[#0b141a]">
        <div className="absolute inset-0 chat-pattern"></div>
        <div className="relative animate-float">
          <div className="absolute inset-0 bg-[#00e676] blur-[80px] opacity-10 scale-125"></div>
          <div className="w-28 h-28 glass-card rounded-[2rem] flex items-center justify-center border-white/5 shadow-2xl relative z-10">
             <Target className="w-14 h-14 text-[#00e676]" />
             <div className="absolute inset-0 shimmer opacity-5"></div>
          </div>
        </div>
        <div className="mt-8 text-center relative z-10">
           <h1 className="text-2xl font-black text-white italic tracking-tighter mb-1">رماية القاهرة</h1>
           <p className="text-[#00e676] text-[8px] font-black uppercase tracking-[0.6em] opacity-60">SYSTEM v15</p>
        </div>
        <div className="absolute bottom-12 flex flex-col items-center gap-3">
           <div className="w-8 h-0.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-[#00e676] w-1/2 animate-[loading_1.5s_infinite_ease-in-out]"></div>
           </div>
           <span className="text-[8px] font-black text-[#8696a0] uppercase tracking-widest">تلاشاني</span>
        </div>
        <style>{`
          @keyframes loading { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-[#0b141a] relative overflow-hidden items-center font-['Cairo']">
      <div className="absolute inset-0 chat-pattern"></div>
      
      <div className="w-full max-w-md h-full flex flex-col relative z-30 bg-[#0b141a] border-x border-white/5">
        
        {/* Compact Header */}
        <header className="bg-[#202c33] px-4 py-3 flex items-center justify-between shadow-lg z-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#00a884] flex items-center justify-center text-white border border-white/10">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">رماية القاهرة</h1>
              <div className="flex items-center gap-1">
                 <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] animate-pulse"></span>
                 <span className="text-[8px] font-black text-[#00e676] uppercase tracking-[0.3em]">Tlashani AI</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[#aebac1]">
            <button onClick={() => setShowSupport(true)} className="p-2 active:bg-white/5 rounded-full transition-colors"><Settings className="w-5 h-5" /></button>
            <button className="p-2 active:bg-white/5 rounded-full transition-colors"><MoreVertical className="w-5 h-5" /></button>
          </div>
        </header>

        {/* Dense Info Strip */}
        <div className="bg-[#111b21]/90 backdrop-blur-md px-4 py-1.5 flex justify-between border-b border-white/5 text-[10px] font-bold text-[#8696a0] z-40">
            <div className="flex items-center gap-1.5 uppercase"><Users className="w-3.5 h-3.5 text-[#00e676]" /> {names.length} مقيد</div>
            <div className="flex items-center gap-1.5 uppercase"><Clock className="w-3.5 h-3.5 text-[#00e676]" /> {names[names.length-1]?.timestamp || '--:--'}</div>
        </div>

        {/* Responsive Trainee List */}
        <main 
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-3 py-6 space-y-4 no-scrollbar pb-40"
        >
          {names.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-10 text-[#8696a0] text-center px-8 pointer-events-none">
              <Scan className="w-12 h-12 mb-3" />
              <p className="text-[10px] font-bold italic tracking-wide">النظام جاهز... ابدأ بتلقين الأسماء</p>
            </div>
          ) : (
            names.map((item, index) => (
              <div key={item.id} className="flex flex-col items-end animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="glass-card px-4 py-3 min-w-[140px] max-w-[85%] rounded-2xl rounded-tr-none shadow-xl border-white/10 ring-1 ring-white/5">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      {editingId === item.id ? (
                        <input 
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                          className="bg-transparent border-b border-[#00e676] text-white w-full outline-none py-1 text-lg font-bold leading-relaxed"
                        />
                      ) : (
                        <h4 
                          onClick={() => { setEditingId(item.id); setEditValue(item.name); }}
                          className="text-lg font-bold text-white tracking-tight cursor-pointer leading-normal break-words"
                        >
                          {item.name}
                        </h4>
                      )}
                    </div>
                    <button 
                      onClick={() => deleteItem(item.id)} 
                      className="text-white/30 hover:text-red-500/80 p-1 rounded-full active:bg-white/5 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/5 mt-1">
                    <span className="text-[11px] font-bold text-[#8696a0] tracking-wider">{item.timestamp}</span>
                    <CheckCheck className="w-4 h-4 text-[#53bdeb] opacity-80" />
                  </div>
                </div>
              </div>
            ))
          )}
          {isProcessing && (
            <div className="flex flex-col items-start animate-pulse">
               <div className="bg-[#202c33] px-4 py-2 rounded-2xl rounded-tr-none text-[10px] font-black text-[#00e676] border border-[#00e676]/20 shadow-lg">
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] animate-ping"></span>
                    جارِ استيعاب الاسم...
                  </span>
               </div>
            </div>
          )}
        </main>

        {/* ERGONOMIC FAB LAYER (Optimized for Mobile) */}
        <div className="absolute bottom-28 left-0 right-0 px-5 z-40 flex items-center justify-between pointer-events-none">
           {/* Prominent Mic on the Left */}
           <button 
             onClick={isListening ? () => recognitionRef.current?.stop() : startListening}
             className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all active:scale-90 pointer-events-auto ring-1 ring-white/10 ${isListening ? 'bg-red-500 shadow-red-500/30' : 'bg-[#00e676] shadow-emerald-500/30'}`}
           >
             {isListening ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
           </button>

           {/* Export Stack on the Right */}
           {names.length > 0 && (
             <div className="flex items-center gap-2.5 pointer-events-auto">
                <button 
                  onClick={() => handleExportRequest(ExportFormat.CSV)} 
                  className="w-11 h-11 bg-[#202c33] rounded-2xl flex items-center justify-center text-[#00e676] border border-white/10 shadow-lg active:scale-90 transition-transform hover:bg-[#2a3942]"
                  title="CSV"
                >
                  <Table className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => handleExportRequest('DOC')} 
                  className="w-11 h-11 bg-[#00a884] rounded-2xl flex items-center justify-center text-white border border-white/10 shadow-lg active:scale-90 transition-transform hover:bg-[#00c69c]"
                  title="Word"
                >
                  <FileText className="w-5 h-5" />
                </button>
             </div>
           )}
        </div>

        {/* Modern Bottom Bar */}
        <footer className="bg-[#202c33] px-4 py-5 border-t border-white/5 z-50 flex justify-center">
          <div className="w-full bg-[#2a3942] rounded-xl px-5 py-3 text-[12px] text-white/50 truncate font-bold text-center border border-white/5 shadow-inner">
            {isListening ? (
              <span className="text-[#00e676] font-black tracking-widest animate-pulse">جاري الاستماع الآن...</span>
            ) : (
              transcript || "تلاشاني: سجل أسماء المجندين بالصوت"
            )}
          </div>
        </footer>
      </div>

      {/* COMPACT NAMING MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-[300px] bg-[#111b21] rounded-[2.5rem] p-6 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-white mb-5 text-center tracking-tight">تسمية الكشف</h3>
            <div className="space-y-4">
               <input 
                 autoFocus
                 value={fileName}
                 onChange={(e) => setFileName(e.target.value)}
                 className="bg-[#202c33] text-white font-bold text-md w-full outline-none border border-white/10 rounded-2xl px-5 py-3.5 text-center focus:border-[#00e676]/50 focus:ring-1 focus:ring-[#00e676]/50 transition-all placeholder:text-white/20"
                 placeholder="مثلاً: كشف الرماية 1"
               />
               <div className="flex gap-2.5 pt-2">
                  <button 
                    onClick={() => setShowExportModal(false)} 
                    className="flex-1 py-3.5 bg-[#202c33] rounded-2xl text-[11px] font-black text-[#8696a0] active:opacity-60 transition-opacity border border-white/5"
                  >
                    إلغاء
                  </button>
                  <button 
                    onClick={confirmExport} 
                    className="flex-[2] py-3.5 bg-[#00e676] rounded-2xl text-[11px] font-black text-[#0b141a] active:scale-95 transition-transform shadow-lg shadow-emerald-500/20"
                  >
                    تأكيد الحفظ
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* ANDROID-STYLE SUPPORT SHEET */}
      {showSupport && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-end justify-center animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-[#111b21] rounded-t-[3rem] p-8 border-t border-[#00e676]/30 shadow-2xl animate-in slide-in-from-bottom-full duration-400">
            <div className="w-12 h-1.5 bg-[#3b4a54] rounded-full mx-auto mb-8 opacity-50"></div>
            
            <div className="flex flex-col items-center mb-10">
              <div className="w-20 h-20 bg-[#00e676] rounded-3xl flex items-center justify-center shadow-2xl mb-5 rotate-12 transition-transform hover:rotate-0">
                <Target className="w-12 h-12 text-[#0b141a]" />
              </div>
              <h2 className="text-3xl font-black italic text-white tracking-tighter">تلاشاني</h2>
              <span className="text-[10px] font-black text-[#00e676] uppercase tracking-[0.5em] mt-2 opacity-80">Advanced Military Logic</span>
            </div>
            
            <div className="space-y-3.5 mb-10">
              <a href="https://wa.me/201282735262" target="_blank" rel="noreferrer" className="flex items-center gap-5 p-5 bg-[#202c33] rounded-[2rem] border border-white/10 active:bg-[#2a3942] transition-all group">
                <div className="w-12 h-12 bg-emerald-500/10 flex items-center justify-center text-[#00e676] rounded-2xl group-active:scale-90 transition-transform"><MessageCircle className="w-6 h-6" /></div>
                <div className="text-right flex-1">
                  <p className="text-[9px] font-black text-[#8696a0] uppercase tracking-wider mb-0.5">واتساب الدعم المباشر</p>
                  <p className="font-black text-xl text-white tracking-tighter" dir="ltr">01282735262</p>
                </div>
              </a>
              <a href="https://t.me/+201282735262" target="_blank" rel="noreferrer" className="flex items-center gap-5 p-5 bg-[#202c33] rounded-[2rem] border border-white/10 active:bg-[#2a3942] transition-all group">
                <div className="w-12 h-12 bg-blue-500/10 flex items-center justify-center text-[#0088cc] rounded-2xl group-active:scale-90 transition-transform"><Send className="w-6 h-6" /></div>
                <div className="text-right flex-1">
                  <p className="text-[9px] font-black text-[#8696a0] uppercase tracking-wider mb-0.5">تليجرام المطور</p>
                  <p className="font-black text-xl text-white tracking-tighter" dir="ltr">@Tlashani</p>
                </div>
              </a>
            </div>
            
            <button 
              onClick={() => setShowSupport(false)} 
              className="w-full py-4.5 rounded-[2rem] bg-[#00e676] text-lg font-black text-[#0b141a] active:scale-95 transition-all shadow-xl shadow-emerald-500/10 mb-2"
            >
              العودة للبرنامج
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
