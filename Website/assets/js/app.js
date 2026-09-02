const commands = [
  ['menu','General'],['help','General'],['ping','General'],['alive','General'],['owner','General'],['profile','Profile'],['setbio','Profile'],['setname','Profile'],['setage','Profile'],['setcity','Profile'],['setcountry','Profile'],['setgender','Profile'],['setbirthday','Profile'],['setwebsite','Profile'],['setpronouns','Profile'],['avatar','Profile'],['myid','Profile'],['balance','Economy'],['bank','Economy'],['deposit','Economy'],['withdraw','Economy'],['daily','Economy'],['work','Economy'],['pay','Economy'],['give','Economy'],['leaderboard','Economy'],['slots','Games'],['coinflip','Games'],['dice','Games'],['roulette','Games'],['blackjack','Games'],['bet','Games'],['gamble','Games'],['streak','Games'],['company','Company'],['createcompany','Company'],['companyprofile','Company'],['renamecompany','Company'],['claim','Company'],['upgradecompany','Company'],['companyboard','Company'],['workcompany','Company'],['warn','Group'],['warnings','Group'],['mute','Group'],['unmute','Group'],['kick','Group'],['add','Group'],['promote','Group'],['demote','Group'],['tagall','Group'],['antilink','Group'],['welcome','Group'],['goodbye','Group'],['sticker','Media'],['toimg','Media'],['play','Media'],['song','Media'],['ytsearch','Media'],['ytmp3','Media'],['ytmp4','Media'],['yt','Media'],['translate','Tools'],['weather','Tools'],['shorturl','Tools']
];

const grid = document.getElementById('commandGrid');
const search = document.getElementById('commandSearch');
const filters = document.getElementById('filters');
let active = 'All';
const categories = ['All', ...new Set(commands.map(c => c[1]))];
filters.innerHTML = categories.map(c => `<button class="filter ${c === 'All' ? 'active' : ''}" data-cat="${c}">${c}</button>`).join('');

document.querySelectorAll('.filter').forEach(btn => btn.addEventListener('click', () => {
  document.querySelectorAll('.filter').forEach(b => b.classList.remove('active'));
  btn.classList.add('active'); active = btn.dataset.cat; render();
}));

function render(){
  const q = search.value.trim().toLowerCase();
  const list = commands.filter(([name,cat]) => (active === 'All' || cat === active) && (!q || name.includes(q) || cat.toLowerCase().includes(q)));
  grid.innerHTML = list.length ? list.map(([name,cat]) => `<div class="command"><code>/${name}</code><small>${cat}</small></div>`).join('') : `<div class="command" style="grid-column:1/-1">No commands found.</div>`;
}
search.addEventListener('input', render); render();

document.getElementById('year').textContent = new Date().getFullYear();

document.getElementById('copyCode').addEventListener('click', async () => {
  const text = document.getElementById('setupCode').innerText;
  try { await navigator.clipboard.writeText(text); document.getElementById('copyCode').textContent='Copied'; setTimeout(()=>document.getElementById('copyCode').textContent='Copy',1200); }
  catch { document.getElementById('copyCode').textContent='Select & copy'; }
});
