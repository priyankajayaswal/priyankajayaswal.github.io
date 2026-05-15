const fs = require('fs');
const path = require('path');

const card2Src = `    {
      id: "dd-bfloat16", num: "Concept 2 of 6", title: "bfloat16 & the numerics zoo",
      desc: "Why ML traded mantissa bits for exponent range \\u2014 BF16, FP8, INT8, and how the MXU multiplies in 16-bit and accumulates in 32-bit.", color: "#7ee787", icon: "\\ud83d\\udd22",
      svg: function(w, h) {
        var vbW = 880, vbH = 360;
        var s = '<svg viewBox="0 0 '+vbW+' '+vbH+'" xmlns="http://www.w3.org/2000/svg" style="background:#0d1117;width:100%;height:auto">';
        s += '<text x="'+(vbW/2)+'" y="24" text-anchor="middle" fill="#c9d1d9" font-size="14" font-weight="700">The ML numerics zoo \\u2014 bit layouts at the same scale</text>';
        s += '<text x="'+(vbW/2)+'" y="42" text-anchor="middle" fill="#8b949e" font-size="11">Each cell = 1 bit. Sign \\u25fc pink, Exponent \\u25fc blue (range), Mantissa \\u25fc green (precision).</text>';
        var formats = [
          { n: 'FP32',         bits: [['S',1,'#f778ba'],['Exponent',8,'#58a6ff'],['Mantissa',23,'#7ee787']], range: '\\u00b13.4\\u00d710\\u00b3\\u2078', eps: '~1.2\\u00d710\\u207b\\u2077', use: 'reference / accumulator' },
          { n: 'FP16',         bits: [['S',1,'#f778ba'],['Exp',5,'#58a6ff'],['Mantissa',10,'#7ee787']],     range: '\\u00b16.5\\u00d710\\u2074',     eps: '~9.8\\u00d710\\u207b\\u2074', use: 'NVIDIA legacy mixed-precision' },
          { n: 'BF16',         bits: [['S',1,'#f778ba'],['Exponent',8,'#58a6ff'],['Mant',7,'#7ee787']],    range: '\\u00b13.4\\u00d710\\u00b3\\u2078', eps: '~7.8\\u00d710\\u207b\\u00b3', use: 'TPU & modern training default' },
          { n: 'FP8 E4M3',     bits: [['S',1,'#f778ba'],['E',4,'#58a6ff'],['M',3,'#7ee787']],              range: '\\u00b1448',              eps: '~0.125',         use: 'forward / activations' },
          { n: 'FP8 E5M2',     bits: [['S',1,'#f778ba'],['Exp',5,'#58a6ff'],['M',2,'#7ee787']],            range: '\\u00b157,344',           eps: '~0.25',          use: 'gradients / backward' },
          { n: 'INT8',         bits: [['Sign+Magnitude',8,'#ffa657']],                                     range: '\\u2212128\\u2026127',     eps: '1 (integer)',    use: 'inference, post-training quant' }
        ];
        var totalBits = 32, x0 = 60, cellW = (vbW - 320) / totalBits;
        var rowH = 38, gap = 8, by0 = 64;
        for (var fi = 0; fi < formats.length; fi++) {
          var f = formats[fi], by = by0 + fi*(rowH+gap);
          s += '<text x="'+(x0-10)+'" y="'+(by+rowH/2+5)+'" text-anchor="end" fill="#c9d1d9" font-size="12" font-weight="700">'+f.n+'</text>';
          var px = x0;
          for (var bi = 0; bi < f.bits.length; bi++) {
            var part = f.bits[bi], pw = part[1] * cellW;
            s += '<rect x="'+px+'" y="'+by+'" width="'+pw+'" height="'+rowH+'" rx="3" fill="'+part[2]+'22" stroke="'+part[2]+'" stroke-width="1.2"/>';
            for (var k = 1; k < part[1]; k++) {
              s += '<line x1="'+(px+k*cellW)+'" y1="'+by+'" x2="'+(px+k*cellW)+'" y2="'+(by+rowH)+'" stroke="'+part[2]+'" stroke-width="0.4" opacity="0.4"/>';
            }
            if (pw > 32) s += '<text x="'+(px+pw/2)+'" y="'+(by+rowH/2+4)+'" text-anchor="middle" fill="'+part[2]+'" font-size="10" font-weight="700">'+part[0]+' ('+part[1]+')</text>';
            px += pw;
          }
          s += '<text x="'+(px+12)+'" y="'+(by+14)+'" fill="#8b949e" font-size="10">range: <tspan fill="#c9d1d9">'+f.range+'</tspan></text>';
          s += '<text x="'+(px+12)+'" y="'+(by+28)+'" fill="#8b949e" font-size="10">\\u03b5: <tspan fill="#c9d1d9">'+f.eps+'</tspan> \\u2014 '+f.use+'</text>';
        }
        s += '<text x="60" y="'+(vbH-14)+'" fill="#7ee787" font-size="11" font-weight="700">FP16 vs BF16:</text>';
        s += '<text x="200" y="'+(vbH-14)+'" fill="#8b949e" font-size="11">same total bits, but BF16 trades 3 mantissa bits for the full FP32 exponent range \\u2014 fewer overflows, fewer NaNs.</text>';
        s += '</svg>';
        return s;
      },
      sections: [
        { title: "The format menu", text:
          'Modern ML hardware ships with a small zoo of numeric formats, each picking a different point on the <b>(range \\u2194 precision \\u2194 storage)</b> trade-off. The TPU MXU defaults to <b>BF16 multiply, FP32 accumulate</b>; newer chips add FP8 for forward/backward passes and INT8 for post-training quantized inference.' +
          '<table class="dd-table"><thead><tr><th>Format</th><th class="num">Bits (S/E/M)</th><th>Approx. range</th><th class="num">Mach-\\u03b5</th><th>Where used</th></tr></thead><tbody>' +
            '<tr><td><b>FP32</b></td><td class="num">1 / 8 / 23</td><td>\\u00b13.4\\u00d710\\u00b3\\u2078</td><td class="num">1.2\\u00d710\\u207b\\u2077</td><td>Master weights & accumulators</td></tr>' +
            '<tr><td>TF32 (NVIDIA)</td><td class="num">1 / 8 / 10</td><td>\\u00b13.4\\u00d710\\u00b3\\u2078</td><td class="num">9.8\\u00d710\\u207b\\u2074</td><td>Ampere+ matmul (FP32 in/out, TF32 inside)</td></tr>' +
            '<tr><td>FP16 (IEEE)</td><td class="num">1 / 5 / 10</td><td>\\u00b16.5\\u00d710\\u2074</td><td class="num">9.8\\u00d710\\u207b\\u2074</td><td>NVIDIA mixed-precision (needs loss scaling)</td></tr>' +
            '<tr><td><b>BF16</b></td><td class="num">1 / 8 / 7</td><td>\\u00b13.4\\u00d710\\u00b3\\u2078</td><td class="num">7.8\\u00d710\\u207b\\u00b3</td><td><b>TPU default; H100/B200 also support</b></td></tr>' +
            '<tr><td>FP8 E4M3</td><td class="num">1 / 4 / 3</td><td>\\u00b1448</td><td class="num">~0.125</td><td>Forward pass / activations (H100, Trillium)</td></tr>' +
            '<tr><td>FP8 E5M2</td><td class="num">1 / 5 / 2</td><td>\\u00b157,344</td><td class="num">~0.25</td><td>Backward pass / gradients</td></tr>' +
            '<tr><td>INT8</td><td class="num">8 (integer)</td><td>\\u2212128\\u2026127</td><td class="num">1</td><td>Quantized inference (TPU v1, edge)</td></tr>' +
          '</tbody></table>'
        },
        { title: "Range vs precision \\u2014 why BF16 won", text:
          'Plot every format as <b>exponent bits (range)</b> on the x-axis and <b>mantissa bits (precision)</b> on the y-axis. Training cares about range (gradients span many orders of magnitude); inference can often live with less of both.' +
          '<svg class="dd-mini" viewBox="0 0 600 280" xmlns="http://www.w3.org/2000/svg" style="background:#0d1117;border:1px solid #30363d;border-radius:6px">' +
            '<text x="300" y="20" text-anchor="middle" fill="#c9d1d9" font-size="12" font-weight="700">Range (exponent bits) \\u2192   vs   Precision (mantissa bits) \\u2191</text>' +
            // Axes
            '<line x1="60" y1="240" x2="560" y2="240" stroke="#8b949e" stroke-width="1"/>' +
            '<line x1="60" y1="40" x2="60" y2="240" stroke="#8b949e" stroke-width="1"/>' +
            '<text x="310" y="265" text-anchor="middle" fill="#8b949e" font-size="11">exponent bits</text>' +
            '<text x="20" y="140" text-anchor="middle" fill="#8b949e" font-size="11" transform="rotate(-90 20 140)">mantissa bits</text>' +
            (function(){
              // x: 0..8 exp bits map to 60..560; y: 0..23 mant bits map to 240..40
              function xp(e) { return 60 + e * (500/8); }
              function yp(m) { return 240 - m * (200/23); }
              var pts = [
                { n: 'FP32',     e: 8, m: 23, c: '#58a6ff' },
                { n: 'TF32',     e: 8, m: 10, c: '#79c0ff' },
                { n: 'FP16',     e: 5, m: 10, c: '#ff7b72' },
                { n: 'BF16',     e: 8, m: 7,  c: '#7ee787' },
                { n: 'FP8 E4M3', e: 4, m: 3,  c: '#ffa657' },
                { n: 'FP8 E5M2', e: 5, m: 2,  c: '#d2a8ff' },
                { n: 'INT8',     e: 0, m: 7,  c: '#a5a5a5' }
              ];
              var s = '';
              for (var ix = 0; ix <= 8; ix += 2) s += '<text x="'+xp(ix)+'" y="255" text-anchor="middle" fill="#6e7681" font-size="9">'+ix+'</text>';
              for (var iy = 0; iy <= 23; iy += 5) s += '<text x="52" y="'+(yp(iy)+3)+'" text-anchor="end" fill="#6e7681" font-size="9">'+iy+'</text>';
              for (var i = 0; i < pts.length; i++) {
                var p = pts[i], cx = xp(p.e), cy = yp(p.m);
                s += '<circle cx="'+cx+'" cy="'+cy+'" r="7" fill="'+p.c+'33" stroke="'+p.c+'" stroke-width="1.6"/>';
                s += '<text x="'+(cx+11)+'" y="'+(cy+4)+'" fill="'+p.c+'" font-size="10" font-weight="700">'+p.n+'</text>';
              }
              s += '<rect x="320" y="48" width="220" height="60" rx="6" fill="#7ee78711" stroke="#7ee787" stroke-width="1"/>';
              s += '<text x="430" y="66" text-anchor="middle" fill="#7ee787" font-size="10" font-weight="700">BF16 \\u2261 FP32 truncated</text>';
              s += '<text x="430" y="80" text-anchor="middle" fill="#c9d1d9" font-size="9">same exponent \\u2192 same overflow point</text>';
              s += '<text x="430" y="94" text-anchor="middle" fill="#c9d1d9" font-size="9">half the bits, no loss-scaling needed</text>';
              return s;
            })() +
          '</svg>'
        },
        { title: "Gradients live where BF16 lives", text:
          'A typical transformer\\u2019s gradient histogram has a long left tail \\u2014 many gradients are tiny. FP16 cannot represent values below ~6\\u00d710\\u207b\\u2075; everything smaller becomes zero (\\u201cunderflow\\u201d) and the model stops learning. BF16 reaches all the way down to ~10\\u207b\\u00b3\\u2078, the same as FP32, so no loss-scaling trick is needed.' +
          '<svg class="dd-mini" viewBox="0 0 600 220" xmlns="http://www.w3.org/2000/svg" style="background:#0d1117;border:1px solid #30363d;border-radius:6px">' +
            '<text x="300" y="20" text-anchor="middle" fill="#c9d1d9" font-size="12" font-weight="700">Gradient magnitude histogram (log scale) and what each format can see</text>' +
            // FP16 zone (bad)
            '<rect x="340" y="50" width="220" height="120" fill="#ff7b7211" stroke="#ff7b72" stroke-width="1" stroke-dasharray="3,3"/>' +
            '<text x="450" y="64" text-anchor="middle" fill="#ff7b72" font-size="10" font-weight="700">FP16 dynamic range</text>' +
            // BF16 zone (good)
            '<rect x="60" y="40" width="500" height="140" fill="#7ee78708" stroke="#7ee787" stroke-width="1" stroke-dasharray="3,3"/>' +
            '<text x="80" y="54" fill="#7ee787" font-size="10" font-weight="700">BF16 / FP32 dynamic range</text>' +
            // Histogram bars (synthetic, log-x)
            (function(){
              var s = '', bars = [3,5,8,14,22,33,46,55,60,52,38,24,13,6,3,1];
              var x0 = 70, w = 30, baseY = 170;
              for (var i = 0; i < bars.length; i++) {
                var bx = x0 + i*w, bh = bars[i] * 1.8;
                var inFp16 = (i >= 9 && i <= 14);
                s += '<rect x="'+(bx+2)+'" y="'+(baseY-bh)+'" width="'+(w-4)+'" height="'+bh+'" fill="'+(inFp16?'#ff7b7244':'#7ee78744')+'" stroke="'+(inFp16?'#ff7b72':'#7ee787')+'" stroke-width="0.8"/>';
              }
              return s;
            })() +
            '<line x1="60" y1="170" x2="560" y2="170" stroke="#8b949e" stroke-width="1"/>' +
            '<text x="60" y="195" fill="#8b949e" font-size="10">10\\u207b\\u00b3\\u2078</text>' +
            '<text x="190" y="195" fill="#8b949e" font-size="10">10\\u207b\\u00b9\\u2070</text>' +
            '<text x="340" y="195" fill="#8b949e" font-size="10">10\\u207b\\u2075</text>' +
            '<text x="450" y="195" fill="#8b949e" font-size="10">1</text>' +
            '<text x="540" y="195" fill="#8b949e" font-size="10">10\\u2074</text>' +
            '<text x="300" y="213" text-anchor="middle" fill="#8b949e" font-size="10">|gradient| (log scale)</text>' +
          '</svg>' +
          '<div class="dd-callout"><span class="dd-callout-icon">\\ud83c\\udfaf</span><span><b>This is why TPUs picked BF16 in 2018.</b> Half-precision storage (2\\u00d7 less HBM, 2\\u00d7 less ICI) with FP32-like robustness \\u2014 no loss scaling, no NaN avalanches, just \\u201cflip the dtype.\\u201d</span></div>'
        },
        { title: "Mixed-precision MAC: BF16 in, FP32 out", text:
          'The TPU MXU does <b>multiplication in 16-bit</b> but <b>accumulates in 32-bit</b>. Why? A single 16-bit MAC is fine, but adding millions of them inside one dot product would lose precision fast. The wide accumulator catches that drift.' +
          '<div class="dd-formula">acc<sub>fp32</sub> += bfloat16_to_fp32(a) \\u00d7 bfloat16_to_fp32(b)</div>' +
          '<pre class="dd-code"><span class="c"># JAX: ask XLA for BF16 multiply, FP32 accumulate</span>\\n<span class="k">import</span> jax.numpy <span class="k">as</span> jnp\\n\\nA = jnp.asarray(weights, dtype=jnp.bfloat16)\\nB = jnp.asarray(activations, dtype=jnp.bfloat16)\\n\\n<span class="c"># preferred_element_type pins the accumulator dtype on TPU</span>\\nC = jnp.dot(A, B, preferred_element_type=jnp.float32)\\n<span class="c"># \\u2192 hardware: BF16 \\u00d7 BF16 inside the MXU, FP32 sum out</span></pre>' +
          '<p style="font-size:12px;color:#8b949e;margin-top:6px">This pattern is so common it\\u2019s the default in most TPU pipelines. NVIDIA Tensor Cores do the same thing (FP16/BF16 multiply, FP32 accumulate) \\u2014 it\\u2019s become the universal mixed-precision contract.</p>'
        },
        { title: "FP32 \\u2192 BF16 is just truncation", text:
          'Because BF16 keeps the same 8 exponent bits as FP32 and just chops the bottom 16 mantissa bits, conversion is the cheapest possible operation: <b>read the high half of the 32-bit word</b>. That\\u2019s why FP32 master weights with BF16 compute is so painless on TPU \\u2014 the cast is free.' +
          '<svg class="dd-mini" viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg" style="background:#0d1117;border:1px solid #30363d;border-radius:6px">' +
            '<text x="300" y="22" text-anchor="middle" fill="#c9d1d9" font-size="12" font-weight="700">FP32 \\u2192 BF16: keep top 16 bits, drop bottom 16</text>' +
            (function(){
              var s = '', x0 = 60, cellW = 16, by = 60;
              // FP32 row: 1 + 8 + 23
              var parts = [['S',1,'#f778ba'],['Exponent',8,'#58a6ff'],['Mantissa',23,'#7ee787']];
              var px = x0;
              for (var i = 0; i < parts.length; i++) {
                var pw = parts[i][1] * cellW;
                s += '<rect x="'+px+'" y="'+by+'" width="'+pw+'" height="34" rx="3" fill="'+parts[i][2]+'22" stroke="'+parts[i][2]+'"/>';
                s += '<text x="'+(px+pw/2)+'" y="'+(by+22)+'" text-anchor="middle" fill="'+parts[i][2]+'" font-size="10" font-weight="700">'+parts[i][0]+' ('+parts[i][1]+')</text>';
                px += pw;
              }
              s += '<text x="40" y="'+(by+22)+'" text-anchor="end" fill="#c9d1d9" font-size="11" font-weight="700">FP32</text>';
              // Brace + arrow showing top 16 kept
              var topW = 16 * cellW;
              s += '<path d="M '+x0+' '+(by-6)+' Q '+(x0 + topW/2)+' '+(by-22)+' '+(x0 + topW)+' '+(by-6)+'" stroke="#ffa657" stroke-width="1.4" fill="none"/>';
              s += '<text x="'+(x0 + topW/2)+'" y="'+(by-26)+'" text-anchor="middle" fill="#ffa657" font-size="10" font-weight="700">top 16 bits kept</text>';
              // Drop indicator on bottom 16
              var dropX = x0 + topW;
              s += '<rect x="'+dropX+'" y="'+(by+38)+'" width="'+(16*cellW)+'" height="14" fill="#ff7b7222" stroke="#ff7b72" stroke-dasharray="2,2"/>';
              s += '<text x="'+(dropX + 16*cellW/2)+'" y="'+(by+50)+'" text-anchor="middle" fill="#ff7b72" font-size="9" font-weight="700">bottom 16 bits truncated (or rounded)</text>';
              // Arrow down
              s += '<line x1="'+(x0 + topW/2)+'" y1="'+(by+44)+'" x2="'+(x0 + topW/2)+'" y2="'+(by+92)+'" stroke="#8b949e" stroke-width="1.4"/>';
              s += '<polygon points="'+(x0 + topW/2 - 4)+','+(by+90)+' '+(x0 + topW/2 + 4)+','+(by+90)+' '+(x0 + topW/2)+','+(by+98)+'" fill="#8b949e"/>';
              // BF16 row
              var by2 = by + 100;
              var bparts = [['S',1,'#f778ba'],['Exponent',8,'#58a6ff'],['M',7,'#7ee787']];
              var px2 = x0;
              for (var j = 0; j < bparts.length; j++) {
                var pw2 = bparts[j][1] * cellW;
                s += '<rect x="'+px2+'" y="'+by2+'" width="'+pw2+'" height="34" rx="3" fill="'+bparts[j][2]+'33" stroke="'+bparts[j][2]+'" stroke-width="1.4"/>';
                s += '<text x="'+(px2+pw2/2)+'" y="'+(by2+22)+'" text-anchor="middle" fill="'+bparts[j][2]+'" font-size="10" font-weight="700">'+bparts[j][0]+' ('+bparts[j][1]+')</text>';
                px2 += pw2;
              }
              s += '<text x="40" y="'+(by2+22)+'" text-anchor="end" fill="#c9d1d9" font-size="11" font-weight="700">BF16</text>';
              return s;
            })() +
          '</svg>'
        },
        { title: "Mixed-precision strategy in practice", text:
          'The recipe most teams converge on: <b>BF16 weights & activations during forward/backward, FP32 master copy of weights for the optimizer step.</b> The optimizer (Adam, etc.) uses FP32 momentum to integrate tiny updates without losing them to BF16 rounding.' +
          '<pre class="dd-code"><span class="c"># Flax: BF16 compute, FP32 master weights</span>\\n<span class="k">import</span> flax.linen <span class="k">as</span> nn\\n<span class="k">import</span> jax.numpy <span class="k">as</span> jnp\\n\\n<span class="k">class</span> <span class="n">Block</span>(nn.Module):\\n  features: <span class="n">int</span>\\n  <span class="k">def</span> setup(<span class="k">self</span>):\\n    <span class="k">self</span>.dense = nn.Dense(\\n      <span class="k">self</span>.features,\\n      dtype=jnp.bfloat16,            <span class="c"># compute in BF16 \\u2192 hits the MXU fast path</span>\\n      param_dtype=jnp.float32         <span class="c"># params stored in FP32 \\u2192 optimizer is precise</span>\\n    )\\n  <span class="k">def</span> __call__(<span class="k">self</span>, x):\\n    <span class="k">return</span> nn.relu(<span class="k">self</span>.dense(x))</pre>' +
          '<div class="dd-callout"><span class="dd-callout-icon">\\u2696\\ufe0f</span><span><b>Three rules of thumb:</b> (1) Activations + matmul in BF16 \\u2014 free 2\\u00d7 speedup. (2) Loss + softmax in FP32 \\u2014 they\\u2019re tiny but precision-critical. (3) Optimizer state in FP32 \\u2014 the \\u201cmaster weights\\u201d that absorb small updates.</span></div>'
        },
        { title: "What\\u2019s next: FP8", text:
          'BF16 was the 2018\\u20132023 default; <b>FP8</b> is the 2024+ frontier. FP8 halves storage and bandwidth again, doubles throughput on hardware that supports it (H100, B200, Trillium TPU v6+). The catch: 8 bits is so few that you must pick which bits to spend on range and which on precision \\u2014 hence two FP8 variants used <b>together</b>.' +
          '<div class="dd-grid">' +
            '<div class="dd-tile"><h4 style="color:#ffa657">FP8 E4M3</h4>' +
              '<div class="dd-spec"><span>Layout</span><b>1S / 4E / 3M</b></div>' +
              '<div class="dd-spec"><span>Range</span><b>\\u00b1448</b></div>' +
              '<div class="dd-spec"><span>Use</span><b>forward + activations</b></div>' +
              '<p style="font-size:11px;color:#8b949e;margin-top:6px">More precision, less range \\u2014 fits the bell-shaped distribution of activations and forward intermediates.</p></div>' +
            '<div class="dd-tile"><h4 style="color:#d2a8ff">FP8 E5M2</h4>' +
              '<div class="dd-spec"><span>Layout</span><b>1S / 5E / 2M</b></div>' +
              '<div class="dd-spec"><span>Range</span><b>\\u00b157,344</b></div>' +
              '<div class="dd-spec"><span>Use</span><b>backward + gradients</b></div>' +
              '<p style="font-size:11px;color:#8b949e;margin-top:6px">More range, less precision \\u2014 catches the long-tail gradient distribution that would otherwise underflow.</p></div>' +
          '</div>' +
          '<p style="font-size:12px;color:#8b949e;margin-top:6px">Per-tensor scaling factors (FP32 multipliers stored alongside each FP8 tensor) shift the dynamic window onto the actual data, so even 4 bits of mantissa works in practice.</p>'
        },
        { title: "Adoption timeline & references", text:
          'BF16 went from \\u201ca weird Google thing\\u201d to industry standard in about four years. FP8 is on the same trajectory.' +
          '<div class="dd-flow">' +
            '<div class="dd-flow-step"><b>2018</b><br>BF16 ships in TPU v2/v3</div>' +
            '<div class="dd-flow-arrow">\\u2192</div>' +
            '<div class="dd-flow-step"><b>2019</b><br>Intel Cooper Lake adds BF16</div>' +
            '<div class="dd-flow-arrow">\\u2192</div>' +
            '<div class="dd-flow-step"><b>2020</b><br>NVIDIA Ampere supports BF16/TF32</div>' +
            '<div class="dd-flow-arrow">\\u2192</div>' +
            '<div class="dd-flow-step"><b>2022</b><br>H100 introduces FP8 (E4M3 / E5M2)</div>' +
            '<div class="dd-flow-arrow">\\u2192</div>' +
            '<div class="dd-flow-step"><b>2024\\u201325</b><br>Trillium & Blackwell B200 \\u2014 FP8 the default</div>' +
          '</div>' +
          '<div class="dd-links">' +
            '<a href="https://cloud.google.com/blog/products/ai-machine-learning/bfloat16-the-secret-to-high-performance-on-cloud-tpus" target="_blank">Google \\u2014 BF16 on Cloud TPU</a>' +
            '<a href="https://arxiv.org/abs/1905.12322" target="_blank">A Study of BFLOAT16 for Deep Learning Training (Kalamkar et al.)</a>' +
            '<a href="https://arxiv.org/abs/2209.05433" target="_blank">FP8 Formats for Deep Learning (Micikevicius et al.)</a>' +
            '<a href="https://docs.nvidia.com/deeplearning/transformer-engine/user-guide/index.html" target="_blank">NVIDIA Transformer Engine \\u2014 FP8 in practice</a>' +
          '</div>'
        }
      ],
      keypoints: [
        { title: "Range > precision for ML", text: "8 exponent bits matter more than mantissa bits \\u2014 BF16 keeps FP32\\u2019s range so loss-scaling tricks are unnecessary." },
        { title: "Multiply 16, accumulate 32", text: "TPU MXU does BF16 \\u00d7 BF16 with FP32 accumulator \\u2014 catches drift across long dot products." },
        { title: "Conversion is free", text: "FP32 \\u2192 BF16 is literally \\u201ckeep top 16 bits\\u201d \\u2014 trivial to implement, zero latency." },
        { title: "FP16 underflows gradients", text: "FP16\\u2019s 5-bit exponent zeros out values below ~6\\u00d710\\u207b\\u2075; BF16 reaches 10\\u207b\\u00b3\\u2078 like FP32." },
        { title: "FP8 needs paired formats", text: "E4M3 for forward (precision), E5M2 for backward (range) \\u2014 plus per-tensor FP32 scales to shift the window." },
        { title: "Master weights stay FP32", text: "Optimizer state and parameter master copy live in FP32 so tiny gradient updates don\\u2019t round to zero." }
      ]
    },
`;

try {
  const fn = new Function('return [' + card2Src.replace(/,\s*$/, '') + ']');
  const arr = fn();
  console.log('Card 2 OK: id=', arr[0].id, 'sections=', arr[0].sections.length, 'keypoints=', arr[0].keypoints.length);
} catch (e) {
  console.error('Card 2 PARSE ERROR:', e.message);
  process.exit(1);
}
fs.writeFileSync(path.join(__dirname, '_card2.txt'), card2Src);
console.log('Wrote _card2.txt, length=', card2Src.length);
