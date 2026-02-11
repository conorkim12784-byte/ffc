
import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Trash2, 
  Target,
  FileText,
  Table,
  Clock,
  Users,
  Settings,
  CheckCheck,
  MoreVertical,
  Scan,
  Send,
  User,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  Zap,
  ChevronLeft,
  Crown
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
  const [pendingFormat, setPendingFormat] = useState<ExportFormat | 'DOCX' | null>(null);

  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('shooting_range_ultra_v17');
    if (saved) setNames(JSON.parse(saved));
    
    const timer = setTimeout(() => {
      setHasEntered(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('shooting_range_ultra_v17', JSON.stringify(names));
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
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

  const handleExportRequest = (format: ExportFormat | 'DOCX') => {
    const defaultName = `كشف_رماية_${new Date().toLocaleDateString('ar-EG').replace(/\//g, '-')}`;
    setFileName(defaultName);
    setPendingFormat(format);
    setShowExportModal(true);
  };

  const confirmExport = () => {
    if (!fileName.trim()) return;
    if (pendingFormat === 'DOCX') {
      executeDocxExport();
    } else if (pendingFormat) {
      executeFileExport(pendingFormat as ExportFormat);
    }
    setShowExportModal(false);
    setPendingFormat(null);
  };

  const executeDocxExport = () => {
    const dateStr = new Date().toLocaleDateString('ar-EG');
    // Generating standard MHTML/HTML for Word which is the most reliable browser-side DOCX emulation
    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40' dir='rtl'>
      <head>
        <meta charset='utf-8'>
        <style>
          @page { size: A4; margin: 2cm; }
          body { font-family: 'Arial', sans-serif; direction: rtl; }
          .header { text-align: center; border-bottom: 2pt solid #00a884; margin-bottom: 30px; padding-bottom: 10px; }
          .title { font-size: 24pt; color: #00a884; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #00a884; color: white; border: 1pt solid #333; padding: 10px; font-size: 14pt; }
          td { border: 1pt solid #333; padding: 8px; text-align: center; font-size: 12pt; }
          .footer { margin-top: 50px; text-align: center; font-size: 10pt; color: #666; font-style: italic; }
        </style>
      </head>
      <body>
        <div class='header'>
          <div class='title'>كشف رماية القاهرة</div>
          <p>تاريخ الكشف: ${dateStr}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th style='width: 10%'>م</th>
              <th style='width: 65%'>الاسم الكامل للمجند</th>
              <th style='width: 25%'>توقيت التسجيل</th>
            </tr>
          </thead>
          <tbody>
            ${names.map((n, i) => `
              <tr>
                <td>${i + 1}</td>
                <td style='text-align: right; padding-right: 15px;'>${n.name}</td>
                <td>${n.timestamp}</td>
              </tr>`).join('')}
          </tbody>
        </table>
        <div class='footer'>تم الاستخراج بواسطة نظام تلاشاني الذكي للرماية</div>
      </body>
      </html>`;
    
    const blob = new Blob(['\ufeff', html], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const executeFileExport = (format: ExportFormat) => {
    let content = "";
    if (format === ExportFormat.CSV) {
      content = "\ufeffم,الاسم الكامل,وقت التسجيل\n" + names.map((n, i) => `${i+1},${n.name},${n.timestamp}`).join('\n');
    } else {
      content = "كشف رماية القاهرة\n" + names.map((n, i) => `${i+1}. ${n.name} [${n.timestamp}]`).join('\n');
    }
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.${format}`;
    link.click();
  };

  if (!hasEntered) {
    return (
      <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-[#0b141a]">
        <div className="absolute inset-0 grid-pattern opacity-10"></div>
        <div className="relative group cursor-none">
          <div className="absolute inset-0 bg-[#00e676]/30 blur-[80px] group-hover:bg-[#00e676]/50 transition-all duration-1000 animate-pulse"></div>
          <div className="relative w-24 h-24 bg-[#202c33] rounded-[2.5rem] flex items-center justify-center border border-white/5 shadow-2xl rotate-12 group-hover:rotate-0 transition-transform duration-500">
            <Target className="w-12 h-12 text-[#00e676]" />
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center">
          <h1 className="text-3xl font-black text-white italic tracking-tighter opacity-0 animate-[fade-in_0.5s_forwards_0.5s]">تلاشاني</h1>
          <div className="flex items-center gap-2 mt-2 opacity-40">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00e676] animate-ping"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Military Logic</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-transparent relative overflow-hidden font-['Cairo'] text-white">
      
      {/* Main Glassy Layout */}
      <div className="w-full max-w-md mx-auto h-full flex flex-col relative z-30 bg-[#0b141a]/95 shadow-2xl border-x border-white/5">
        
        {/* Sleek Header */}
        <header className="bg-[#202c33]/80 backdrop-blur-3xl px-5 py-3 flex items-center justify-between shadow-2xl z-50 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00a884] to-[#00e676] flex items-center justify-center shadow-[0_0_15px_rgba(0,230,118,0.3)]">
               <Target className="w-4 h-4 text-[#0b141a]" />
            </div>
            <div>
              <h1 className="text-xs font-black uppercase tracking-widest text-white/90">رماية القاهرة</h1>
              <div className="flex items-center gap-1.5 -mt-1">
                 <div className="w-1 h-1 rounded-full bg-[#00e676] shadow-[0_0_5px_#00e676]"></div>
                 <span className="text-[7px] font-bold text-[#00e676]/60 tracking-[0.2em]">ULTRA v17</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowSupport(true)} 
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-[#00e676] transition-all active:scale-90 border border-white/5"
            >
              <Zap className="w-4 h-4" />
            </button>
            <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 text-white/40 border border-white/5"><MoreVertical className="w-4 h-4" /></button>
          </div>
        </header>

        {/* Dynamic Data Strip */}
        <div className="bg-[#111b21]/60 backdrop-blur-md px-5 py-1 flex justify-between items-center text-[9px] font-black text-white/30 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Users className="w-3 h-3 text-[#00e676]" />
              <span className="bg-white/5 px-2 py-0.5 rounded-md text-[#00e676]">{names.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-[#00e676]/40" />
              <span className="tracking-tighter">{names[names.length-1]?.timestamp || '--:--'}</span>
            </div>
        </div>

        {/* High-Performance List Area */}
        <main 
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-5 py-6 space-y-4 no-scrollbar pb-28 relative"
        >
          {names.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-10 space-y-4 pointer-events-none">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-[#00e676] flex items-center justify-center animate-[spin_10s_linear_infinite]">
                 <Scan className="w-10 h-10" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-center">بانتظار تلقيم البيانات</p>
            </div>
          ) : (
            names.map((item, idx) => (
              <div 
                key={item.id} 
                className="flex flex-col items-end animate-in fade-in slide-in-from-right-4 duration-500 group"
              >
                <div className="glass-card px-4 py-3 min-w-[140px] max-w-[90%] rounded-2xl rounded-tr-none shadow-2xl border-white/10 hover:border-[#00e676]/20 transition-all relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-1 h-full bg-[#00e676]/20"></div>
                  <div className="flex items-center justify-between gap-5 relative z-10">
                    <div className="flex-1">
                      {editingId === item.id ? (
                        <input 
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                          className="bg-white/5 border-b border-[#00e676] text-white w-full outline-none py-1 px-2 text-sm font-bold rounded"
                        />
                      ) : (
                        <div className="flex items-center gap-3">
                           <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black text-white/20 group-hover:text-[#00e676] transition-colors">
                              {idx + 1}
                           </div>
                           <h4 
                             onClick={() => { setEditingId(item.id); setEditValue(item.name); }}
                             className="text-[14px] font-bold text-white/90 leading-tight cursor-pointer tracking-tight"
                           >
                             {item.name}
                           </h4>
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => deleteItem(item.id)} 
                      className="text-white/5 hover:text-red-500/80 p-1.5 rounded-xl hover:bg-red-500/5 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-2 opacity-30 border-t border-white/5 pt-1.5">
                    <span className="text-[8px] font-black tracking-widest">{item.timestamp}</span>
                    <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                  </div>
                </div>
              </div>
            ))
          )}
          {isProcessing && (
            <div className="flex flex-col items-start animate-in slide-in-from-left-4">
               <div className="bg-[#202c33] px-4 py-2 rounded-2xl rounded-tl-none border border-[#00e676]/20 shadow-xl flex items-center gap-3">
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-[#00e676] rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 bg-[#00e676] rounded-full animate-bounce delay-75"></div>
                    <div className="w-1 h-1 bg-[#00e676] rounded-full animate-bounce delay-150"></div>
                  </div>
                  <span className="text-[9px] font-black text-[#00e676]/80 uppercase tracking-widest">تحليل</span>
               </div>
            </div>
          )}
        </main>

        {/* BOTTOM DOCK - Integrated Experience */}
        <div className="fixed bottom-0 left-0 right-0 w-full flex justify-center z-[60] pointer-events-none p-4">
          <div className="w-full max-w-md pointer-events-auto">
            <div className="bg-[#202c33]/90 backdrop-blur-3xl border border-white/10 p-2.5 rounded-[2rem] flex items-center gap-3 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
              
              <button 
                onClick={isListening ? () => recognitionRef.current?.stop() : startListening}
                className={`w-12 h-12 rounded-[1.2rem] flex items-center justify-center transition-all active:scale-90 shadow-2xl relative overflow-hidden group ${isListening ? 'bg-red-500' : 'bg-[#00e676]'}`}
              >
                {isListening && <div className="absolute inset-0 bg-white/20 animate-ping"></div>}
                {isListening ? <MicOff className="w-6 h-6 text-white relative z-10" /> : <Mic className="w-6 h-6 text-[#0b141a] relative z-10" />}
              </button>

              <div className="flex-1 bg-white/5 rounded-2xl px-5 h-12 flex items-center overflow-hidden border border-white/5 inner-shadow">
                <span className={`text-[11px] font-bold truncate tracking-tight transition-all duration-500 ${isListening ? 'text-[#00e676] animate-pulse scale-105' : 'text-white/20'}`}>
                  {isListening ? "أنظمة الاستماع نشطة..." : (transcript || "تلقيم الأسماء بالصوت")}
                </span>
              </div>

              {names.length > 0 && (
                <div className="flex items-center gap-2">
                  <button onClick={() => handleExportRequest(ExportFormat.CSV)} className="w-11 h-11 bg-white/5 text-[#00e676] rounded-[1.2rem] flex items-center justify-center active:bg-white/10 border border-white/5 transition-colors"><Table className="w-5 h-5" /></button>
                  <button onClick={() => handleExportRequest('DOCX')} className="w-11 h-11 bg-gradient-to-br from-[#00a884] to-[#00e676] text-[#0b141a] rounded-[1.2rem] flex items-center justify-center active:opacity-80 shadow-lg font-black text-[9px]"><FileText className="w-5 h-5" /></button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CREATIVE EXPORT MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-10 animate-in fade-in">
          <div className="w-full max-w-[280px] bg-[#111b21] rounded-[2.5rem] p-8 border border-white/10 shadow-[0_0_50px_rgba(0,230,118,0.1)] animate-in zoom-in-95">
            <div className="flex justify-center mb-6">
               <div className="w-12 h-12 rounded-2xl bg-[#00e676]/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-[#00e676]" />
               </div>
            </div>
            <h3 className="text-[11px] font-black text-white text-center uppercase tracking-[0.3em] mb-4">اسم الكشف الجديد</h3>
            <input 
              autoFocus
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="bg-[#202c33] text-white font-black text-sm w-full outline-none border border-white/5 rounded-2xl px-5 py-4 text-center mb-6 focus:border-[#00e676]/30 transition-all shadow-inner"
              placeholder="DOCX"
            />
            <div className="flex gap-3">
               <button onClick={() => setShowExportModal(false)} className="flex-1 py-4 bg-white/5 rounded-2xl text-[9px] font-black text-white/30 uppercase tracking-widest active:scale-95 transition-transform">رجوع</button>
               <button onClick={confirmExport} className="flex-[2] py-4 bg-[#00e676] rounded-2xl text-[9px] font-black text-[#0b141a] uppercase tracking-widest active:scale-95 shadow-[0_10px_20px_rgba(0,230,118,0.2)]">حفظ الآن</button>
            </div>
          </div>
        </div>
      )}

      {/* ULTRA-MODERN SUPPORT SHEET (Hidden Info Style) */}
      {showSupport && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex items-end justify-center animate-in fade-in duration-500">
          <div className="w-full max-w-md bg-gradient-to-b from-[#111b21] to-[#0b141a] rounded-t-[4rem] p-10 border-t border-white/5 shadow-[0_-30px_100px_rgba(0,230,118,0.15)] relative">
            <div className="w-16 h-1.5 bg-white/10 rounded-full mx-auto mb-12"></div>
            
            <button 
              onClick={() => setShowSupport(false)} 
              className="absolute top-10 left-10 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 active:scale-90"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Pulsing Core */}
            <div className="flex flex-col items-center mb-16 relative">
               <div className="absolute w-40 h-40 bg-[#00e676]/5 rounded-full animate-ping opacity-20"></div>
               <div className="w-24 h-24 bg-gradient-to-br from-[#202c33] to-[#111b21] rounded-[2.5rem] flex items-center justify-center border border-white/10 shadow-2xl relative z-10 overflow-hidden group">
                 <div className="absolute inset-0 bg-[#00e676]/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 <Crown className="w-10 h-10 text-[#00e676] drop-shadow-[0_0_10px_#00e676]" />
               </div>
               <h2 className="text-3xl font-black text-white italic mt-8 tracking-tighter">تلاشاني</h2>
               <div className="flex items-center gap-2 mt-1">
                 <span className="text-[8px] font-black text-[#00e676] uppercase tracking-[0.8em]">Architect</span>
               </div>
            </div>

            {/* CREATIVE ACTION BUTTONS (NO LABELS) */}
            <div className="grid grid-cols-2 gap-5 mb-12">
               {/* Support Button 1 */}
               <a 
                 href="https://wa.me/201282735262" 
                 target="_blank" 
                 rel="noreferrer" 
                 className="group relative flex flex-col items-center justify-center p-8 bg-[#202c33]/30 rounded-[3rem] border border-white/5 transition-all hover:bg-emerald-500/5 active:scale-95"
               >
                 <div className="w-14 h-14 bg-emerald-500/10 rounded-[1.5rem] flex items-center justify-center text-[#00e676] mb-4 group-hover:shadow-[0_0_25px_rgba(16,185,129,0.2)] transition-all">
                    <MessageCircle className="w-7 h-7" />
                 </div>
                 <div className="w-2 h-2 rounded-full bg-[#00e676] opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0"></div>
                 <div className="absolute top-4 right-4 text-white/5 group-hover:text-white/20">
                    <ExternalLink className="w-4 h-4" />
                 </div>
               </a>

               {/* Support Button 2 */}
               <a 
                 href="https://t.me/I0_I6" 
                 target="_blank" 
                 rel="noreferrer" 
                 className="group relative flex flex-col items-center justify-center p-8 bg-[#202c33]/30 rounded-[3rem] border border-white/5 transition-all hover:bg-blue-500/5 active:scale-95"
               >
                 <div className="w-14 h-14 bg-blue-500/10 rounded-[1.5rem] flex items-center justify-center text-[#0088cc] mb-4 group-hover:shadow-[0_0_25px_rgba(59,130,246,0.2)] transition-all">
                    <Send className="w-7 h-7 -rotate-12" />
                 </div>
                 <div className="w-2 h-2 rounded-full bg-[#0088cc] opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0"></div>
                 <div className="absolute top-4 right-4 text-white/5 group-hover:text-white/20">
                    <ExternalLink className="w-4 h-4" />
                 </div>
               </a>
            </div>

            <div className="flex flex-col items-center gap-8">
              <button 
                onClick={() => setShowSupport(false)} 
                className="w-full py-6 rounded-[2.5rem] bg-gradient-to-r from-[#00a884] to-[#00e676] text-sm font-black text-[#0b141a] active:scale-95 transition-all shadow-[0_20px_40px_rgba(0,230,118,0.25)] flex items-center justify-center gap-3 uppercase tracking-widest"
              >
                تأكيد النظام
                <ShieldCheck className="w-5 h-5" />
              </button>
              
              <p className="text-[8px] font-black text-white/10 uppercase tracking-[1em] text-center">Protected by Tlashani AI</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
