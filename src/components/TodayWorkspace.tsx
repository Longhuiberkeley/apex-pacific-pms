import { useStore } from '../lib/store';
import Today from './Today';
import Team from './Team';
import DataLibrary from './DataLibrary';
export default function TodayWorkspace(){
 const s=useStore();return <div className="flex h-full min-h-0 flex-col"><header className="shrink-0 border-b border-line bg-paper px-6 py-4"><h1 className="text-2xl font-semibold">Today</h1><p className="mt-1 text-sm text-muted">Review evidence, resolve exceptions, and move work to the next person.</p><div className="mt-3 flex gap-2">{([['mine','My work'],['team','Team work'],['intake','Document intake']] as const).map(([key,label])=><button key={key} onClick={()=>s.setTodayMode(key)} className={`rounded px-3 py-1.5 text-sm ${s.todayMode===key?'bg-rail text-white':'border border-line bg-surface'}`}>{label}</button>)}</div></header><div className={`min-h-0 flex-1 ${s.todayMode==='mine'?'overflow-hidden':'overflow-y-auto p-6'}`}>{s.todayMode==='mine'?<Today/>:s.todayMode==='team'?<Team/>:<DataLibrary key={s.identity?.role} intake/>}</div></div>;
}
