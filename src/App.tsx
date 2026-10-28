import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowLeftRight, CircleHelp, RotateCcw, Sparkles, Volume2, VolumeX } from 'lucide-react';

type Color = 'red' | 'blue' | 'green' | 'yellow';
type Value = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'Skip' | 'Reverse' | '+2' | 'Wild' | '+4';
type Card = { id: string; color: Color | 'wild'; value: Value };
type Player = { id: string; name: string; hand: Card[]; bot: boolean };
const COLORS: Color[] = ['red', 'blue', 'green', 'yellow'];
const VALUES: Value[] = ['0','1','2','3','4','5','6','7','8','9','Skip','Reverse','+2'];
const glyph: Record<Value, string> = { '0':'0','1':'1','2':'2','3':'3','4':'4','5':'5','6':'6','7':'7','8':'8','9':'9', Skip:'⊘', Reverse:'⇄', '+2':'+2', Wild:'✦', '+4':'+4' };
const makeDeck = (): Card[] => {
  const cards: Card[] = [];
  COLORS.forEach(color => {
    cards.push({ id: crypto.randomUUID(), color, value:'0' });
    VALUES.slice(1).forEach(value => {
      cards.push({ id: crypto.randomUUID(), color, value });
      cards.push({ id: crypto.randomUUID(), color, value });
    });
  });
  for (let i=0;i<4;i++) {
    cards.push({ id: crypto.randomUUID(), color:'wild', value:'Wild' });
    cards.push({ id: crypto.randomUUID(), color:'wild', value:'+4' });
  }
  return cards;
};
const shuffle = <T,>(items:T[]):T[] => {
  const copy=[...items];
  for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}
  return copy;
};
const newGame = () => {
  const deck=shuffle(makeDeck());
  const players:Player[]=[
    {id:'you',name:'You',hand:deck.splice(0,7),bot:false},
    {id:'bot1',name:'Nova',hand:deck.splice(0,7),bot:true},
    {id:'bot2',name:'Pixel',hand:deck.splice(0,7),bot:true},
    {id:'bot3',name:'Echo',hand:deck.splice(0,7),bot:true},
  ];
  let first=deck.pop()!;
  while(first.color==='wild'){deck.unshift(first);first=deck.pop()!;}
  return {players,draw:deck,discard:[first],turn:0,direction:1,activeColor:first.color as Color,notice:'Your turn. Match the color or number.',winner:null as string|null,uno:false};
};
type Game = ReturnType<typeof newGame>;
const isPlayable=(card:Card,top:Card,color:Color)=>card.color==='wild'||card.color===color||card.value===top.value;
function PlayingCard({card,small=false,onClick,disabled=false,selected=false}:{card:Card;small?:boolean;onClick?:()=>void;disabled?:boolean;selected?:boolean}){
  return <button type="button" onClick={onClick} disabled={disabled} className={`playing-card ${card.color} ${small?'small':''} ${selected?'selected':''}`} aria-label={`${card.color} ${card.value}`}>
    <span className="card-corner top">{glyph[card.value]}</span><span className="card-center">{glyph[card.value]}</span><span className="card-corner bottom">{glyph[card.value]}</span>
  </button>;
}
export default function App(){
  const [game,setGame]=useState<Game>(()=>newGame());
  const [sound,setSound]=useState(true);
  const [colorPicker,setColorPicker]=useState<Card|null>(null);
  const [help,setHelp]=useState(false);
  const [lastAction,setLastAction]=useState('GAME STARTED');
  const current=game.players[game.turn];
  const top=game.discard[game.discard.length-1];
  const you=game.players[0];
  const isYourTurn=game.turn===0&&!game.winner;
  const playCard=useCallback((card:Card,color?:Color)=>{
    setGame(g=>{
      if(g.turn!==0||g.winner)return g;
      const player=g.players[0];
      if(!isPlayable(card,g.discard[g.discard.length-1],g.activeColor))return {...g,notice:'That card cannot be played right now.'};
      const players=g.players.map(p=>({...p,hand:[...p.hand]}));
      players[0].hand=players[0].hand.filter(c=>c.id!==card.id);
      const discard=[...g.discard,card];
      let direction=g.direction;
      let next=(g.turn+direction+players.length)%players.length;
      let draw=[...g.draw];
      let notice=`You played ${card.value}.`;
      let activeColor=(card.color==='wild'?(color??COLORS[0]):card.color) as Color;
      if(card.value==='Skip'){next=(next+direction+players.length)%players.length;notice='Next player skipped.';}
      if(card.value==='Reverse'){direction*=-1;if(players.length===2)next=g.turn;notice='Direction reversed!';}
      if(card.value==='+2'||card.value==='+4'){
        const amount=card.value==='+2'?2:4;
        for(let i=0;i<amount;i++){if(!draw.length&&discard.length>1)draw=shuffle(discard.splice(0,discard.length-1));const c=draw.pop();if(c)players[next].hand.push(c);}
        next=(next+direction+players.length)%players.length;
        notice=`+${amount}! ${players[(g.turn+direction+players.length)%players.length].name} draws ${amount}.`;
      }
      if(players[0].hand.length===1)notice='UNO! One card left!';
      const winner=players[0].hand.length===0?'You':null;
      return {...g,players,discard,draw,turn:next,direction,activeColor,notice,winner,uno:players[0].hand.length===1};
    });
    setColorPicker(null);
    setLastAction('CARD PLAYED');
  },[]);
  const drawCard=useCallback(()=>{
    setGame(g=>{
      if(g.turn!==0||g.winner)return g;
      let draw=[...g.draw],discard=[...g.discard];
      if(!draw.length&&discard.length>1)draw=shuffle(discard.splice(0,discard.length-1));
      const card=draw.pop();
      if(!card)return {...g,notice:'No cards left to draw.'};
      const players=g.players.map(p=>({...p,hand:[...p.hand]}));players[0].hand.push(card);
      return {...g,players,draw,discard,notice:`You drew a card. ${isPlayable(card,discard[discard.length-1],g.activeColor)?'You may play it or pass.':'Your turn ends.'}`};
    });
    setLastAction('CARD DRAWN');
  },[]);
  const passTurn=()=>setGame(g=>({...g,turn:(g.turn+g.direction+g.players.length)%g.players.length,notice:'Turn passed.'}));
  const botTurn=useCallback(()=>{
    setGame(g=>{
      if(g.turn===0||g.winner)return g;
      const bot=g.players[g.turn];
      const playable=bot.hand.filter(c=>isPlayable(c,g.discard[g.discard.length-1],g.activeColor));
      const card=playable.sort((a,b)=>(b.color==='wild'?1:0)-(a.color==='wild'?1:0))[0];
      if(!card){
        let draw=[...g.draw],discard=[...g.discard];
        if(!draw.length&&discard.length>1)draw=shuffle(discard.splice(0,discard.length-1));
        const picked=draw.pop();
        const players=g.players.map(p=>({...p,hand:[...p.hand]}));if(picked)players[g.turn].hand.push(picked);
        return {...g,players,draw,discard,turn:(g.turn+g.direction+g.players.length)%g.players.length,notice:`${bot.name} drew a card.`};
      }
      const players=g.players.map(p=>({...p,hand:[...p.hand]}));players[g.turn].hand=players[g.turn].hand.filter(c=>c.id!==card.id);
      const discard=[...g.discard,card];let direction=g.direction;let next=(g.turn+direction+g.players.length)%g.players.length;let draw=[...g.draw];let activeColor=(card.color==='wild'?COLORS[Math.floor(Math.random()*4)]:card.color) as Color;
      if(card.value==='Skip')next=(next+direction+g.players.length)%g.players.length;
      if(card.value==='Reverse'){direction*=-1;if(players.length===2)next=g.turn;}
      if(card.value==='+2'||card.value==='+4'){const n=card.value==='+2'?2:4;for(let i=0;i<n;i++){if(!draw.length&&discard.length>1)draw=shuffle(discard.splice(0,discard.length-1));const c=draw.pop();if(c)players[next].hand.push(c);}next=(next+direction+g.players.length)%players.length;}
      const winner=players[g.turn].hand.length===0?bot.name:null;
      return {...g,players,discard,draw,turn:next,direction,activeColor,notice:winner?`${bot.name} wins!`:`${bot.name} played ${card.value}.`,winner,uno:players[0].hand.length===1};
    });
  },[]);
  useEffect(()=>{if(game.turn!==0&&!game.winner){const t=window.setTimeout(botTurn,850);return()=>window.clearTimeout(t);}},[game.turn,game.winner,botTurn]);
  const playableIds=useMemo(()=>new Set(you.hand.filter(c=>isPlayable(c,top,game.activeColor)).map(c=>c.id)),[you.hand,top,game.activeColor]);
  const restart=()=>{setGame(newGame());setLastAction('NEW GAME');setColorPicker(null);};
  return <main className="app-shell">
    <header className="topbar"><a className="brand" href="#"><span className="brand-mark">U</span><span>UNO<span className="brand-light">/PLAY</span></span></a><div className="top-status"><span className="live-dot"/>{game.winner?'GAME OVER':'LOCAL MATCH'} <span className="status-divider"/> MATCH #0428</div><div className="top-actions"><button className="icon-button" onClick={()=>setHelp(v=>!v)} aria-label="Rules"><CircleHelp size={18}/></button><button className="icon-button" onClick={()=>setSound(v=>!v)} aria-label="Toggle sound">{sound?<Volume2 size={18}/>:<VolumeX size={18}/>}</button><button className="new-game" onClick={restart}><RotateCcw size={15}/> NEW GAME</button></div></header>
    <section className="hero-line"><div><div className="eyebrow"><Sparkles size={13}/> THE CLASSIC, REIMAGINED</div><h1>Play your cards<span>.</span></h1><p>One deck. Four players. No mercy.</p></div><div className="round-info"><span>ROUND</span><strong>01 <i>/ 01</i></strong><span className="round-line"/></div></section>
    {help&&<div className="help-panel"><strong>Quick rules</strong><p>Match the top discard by color or value. Wild cards can be played anytime. Skip, Reverse, +2 and +4 change the flow. Empty your hand to win. Stacking is off in this version.</p><button onClick={()=>setHelp(false)}>GOT IT</button></div>}
    <section className="table">
      <div className="table-grain"/>
      <div className="opponents">{game.players.slice(1).map((p,i)=><div key={p.id} className={`opponent ${game.turn===i+1?'active':''}`}><div className={`avatar avatar-${i}`}>{['N','P','E'][i]}</div><div className="opponent-name">{p.name}<small>{game.turn===i+1?'THINKING…':p.bot?'AI PLAYER':'PLAYER'}</small></div><div className="card-count"><span>▰</span>{p.hand.length}</div></div>)}</div>
      <div className="center-table"><div className="pile draw-pile"><div className="deck-back"><span>UNO</span><small>PLAY</small></div><span className="pile-label">DRAW PILE</span><span className="pile-count">{game.draw.length} CARDS</span><button className="pile-hit" onClick={drawCard} disabled={!isYourTurn} aria-label="Draw a card"/></div><div className="table-center"><div className="turn-pill"><span className="live-dot"/>{current.name.toUpperCase()}'S TURN</div><div className="discard-stack"><PlayingCard card={top}/></div><span className="pile-label">DISCARD PILE</span><span className="active-color"><i className={game.activeColor}/>{game.activeColor.toUpperCase()}</span></div><div className="table-note"><ArrowLeftRight size={14}/><span>{game.direction===1?'CLOCKWISE':'COUNTER-CLOCKWISE'}</span></div></div>
      <div className="table-bottom"><div className="action-log"><span className="log-dot"/><div><small>{lastAction}</small><p>{game.notice}</p></div></div><div className="deck-meta"><span>DECK STATUS</span><strong>{game.draw.length}<small> / 108</small></strong></div></div>
    </section>
    <section className="hand-section"><div className="hand-heading"><div><span className="eyebrow">YOUR HAND</span><h2>Make your move <span>({you.hand.length})</span></h2></div><div className="hand-controls"><span className={isYourTurn?'turn-ready':'turn-wait'}><i/>{isYourTurn?'YOUR TURN':'WAITING'}</span><button className="draw-button" disabled={!isYourTurn} onClick={drawCard}><ArrowDown size={15}/> DRAW CARD</button><button className="pass-button" disabled={!isYourTurn} onClick={passTurn}>PASS</button></div></div>
      <div className="hand-cards">{you.hand.map((card,index)=><div className="hand-card-wrap" key={card.id} style={{'--card-index':index} as React.CSSProperties}><PlayingCard card={card} disabled={!isYourTurn||!playableIds.has(card.id)} selected={playableIds.has(card.id)} onClick={()=>card.color==='wild'?setColorPicker(card):playCard(card)}/>{playableIds.has(card.id)&&isYourTurn&&<span className="play-hint">PLAY</span>}</div>)}</div>
      {colorPicker&&<div className="color-picker"><span>CHOOSE A COLOR</span>{COLORS.map(c=><button key={c} className={`color-choice ${c}`} onClick={()=>playCard(colorPicker,c)} aria-label={c}/>)}</div>}
      <div className="hand-footer"><span><kbd>CLICK</kbd> A HIGHLIGHTED CARD TO PLAY</span><span><b>{you.hand.length}</b> CARDS IN HAND</span></div>
    </section>
    {game.winner&&<div className="modal-backdrop"><div className="result-modal"><div className="eyebrow"><Sparkles size={14}/> MATCH COMPLETE</div><h2>{game.winner==='You'?'You did it!':`${game.winner} wins.`}</h2><p>{game.winner==='You'?'Perfect play. Ready for another round?':'Better luck next round. Rematch?'}</p><button className="new-game" onClick={restart}><RotateCcw size={15}/> PLAY AGAIN</button></div></div>}
    <footer><span>UNO/PLAY <i>•</i> BUILT FOR THE LOVE OF THE GAME</span><span>LOCAL MATCH <i>•</i> AI OPPONENTS <i>•</i> V0.1.0</span></footer>
  </main>;
}