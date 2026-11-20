/** Shared styles for admin pages (imported as a string into each component's styles). */
export const ADMIN_CSS = `
.ph{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;margin-bottom:26px;flex-wrap:wrap}.ph h1{font-size:clamp(30px,4vw,42px)}.ph p{color:var(--ink-3);margin-top:6px}
.panel{background:#fff;border:1px solid var(--line);border-radius:var(--r-lg);padding:22px;box-shadow:var(--shadow-sm)}
.tbl{width:100%;border-collapse:collapse;font-size:14.5px}.tbl th{text-align:left;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--mute);padding:10px 14px;border-bottom:1px solid var(--line);white-space:nowrap}
.tbl td{padding:14px;border-bottom:1px solid var(--line);vertical-align:middle}.tbl tr:last-child td{border-bottom:0}.tbl tbody tr{transition:background .2s}.tbl tbody tr:hover{background:#fcfaf5}
.scroll{overflow-x:auto;margin:0 -8px;padding:0 8px}
.st{font-size:12px;font-weight:700;padding:5px 11px;border-radius:99px;white-space:nowrap;background:var(--sand);color:var(--ink-2);display:inline-block}
.st.ok{background:#d8f1e2;color:#1c6b45}.st.warn{background:#fdf0d5;color:#8a5a10}.st.bad{background:#fde2dc;color:#a22a18}.st.info{background:#e1ecf8;color:#1d4f86}.st.vio{background:#efe3fa;color:#5d33a0}
.tools{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:18px;align-items:center}.tools .input,.tools .select{min-height:44px;width:auto;border-radius:99px}.tools .grow{flex:1;min-width:200px}
.ibtn{width:38px;height:38px;border-radius:12px;display:inline-grid;place-items:center;color:var(--ink-2);transition:all .25s var(--ease)}.ibtn:hover{background:var(--sand);transform:translateY(-2px)}.ibtn.del:hover{background:#fde2dc;color:var(--bad)}.ibtn.on{color:var(--gold)}
.empty{text-align:center;padding:50px 10px;color:var(--ink-3);display:grid;justify-items:center;gap:8px}.empty ec-icon{color:var(--ember)}
.errbar{display:flex;gap:12px;align-items:center;background:#fdeae6;color:#8f2415;border-radius:14px;padding:12px 16px;margin-bottom:16px;flex-wrap:wrap}.errbar button{font-weight:700;text-decoration:underline}
.skrows{display:grid;gap:10px}.skrows .skel{height:56px}
.pgr{display:flex;justify-content:center;gap:6px;margin-top:20px;align-items:center}.pgr button{min-width:40px;height:40px;border-radius:50%;font-weight:600;border:1.5px solid var(--line)}.pgr button.on{background:var(--ink);color:#fff;border-color:var(--ink)}.pgr button[disabled]{opacity:.35}
.thumb{width:68px;height:52px;border-radius:12px;overflow:hidden;flex:none;display:block}.thumb ec-img{height:100%}
.cardlist{display:none}
@media(max-width:760px){.tbl.rt thead{display:none}.tbl.rt,.tbl.rt tbody,.tbl.rt tr,.tbl.rt td{display:block;width:100%}.tbl.rt tr{padding:14px 4px;border-bottom:1px solid var(--line)}.tbl.rt td{border:0;padding:4px 10px}.tbl.rt td[data-l]::before{content:attr(data-l);display:block;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--mute);margin-bottom:2px}}
`;
