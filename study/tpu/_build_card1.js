// Replacement for cards 1-3 in C.deepDives. This file:
// 1. Defines the 3 new cards (validates JS syntax)
// 2. Generates the source-text replacement string
// 3. Splices it into index.html at lines 714-795 (1-indexed)

const fs = require('fs');
const path = require('path');

// ===== CARD 1: dd-systolic =====
const card1Src = `    {
      id: "dd-systolic", num: "Concept 1 of 6", title: "Systolic Arrays",
      desc: "2D grid of MACs, weight-stationary dataflow, matrix multiply.", color: "#58a6ff", icon: "\\ud83d\\udd32",
      svg: function(w, h) {
        var vbW = 820, vbH = 400;
        var ox = 260, oy = 100, cs = 64;
        var s = '<svg viewBox="0 0 '+vbW+' '+vbH+'" xmlns="http://www.w3.org/2000/svg" style="background:#0d1117;width:100%;height:auto">';
        s += '<text x="'+(vbW/2)+'" y="22" text-anchor="middle" fill="#c9d1d9" font-size="14" font-weight="700">4\\u00d74 Weight-Stationary Systolic Array \\u2014 snapshot at cycle t = 3</text>';
        s += '<text x="'+(vbW/2)+'" y="40" text-anchor="middle" fill="#8b949e" font-size="11">A streams \\u2192   B streams \\u2193   partial sums accumulate \\u2193</text>';
        s += '<g font-family="Courier New,monospace" font-size="10">';
        for (var k = 0; k <= 6; k++) {
          var tx = 60 + k*22, on = (k === 3);
          s += '<rect x="'+tx+'" y="58" width="18" height="16" rx="2" fill="'+(on?'#ffa65733':'#161b22')+'" stroke="'+(on?'#ffa657':'#30363d')+'"/>';
          s += '<text x="'+(tx+9)+'" y="70" text-anchor="middle" fill="'+(on?'#ffa657':'#6e7681')+'">'+k+'</text>';
        }
        s += '<text x="60" y="52" fill="#8b949e">cycle</text></g>';
        for (var r = 0; r < 4; r++) for (var c = 0; c < 4; c++) {
          var cx = ox + c*cs, cy = oy + r*cs, active = (r + c) <= 3;
          var psum = active ? ((r+1)*7 + (c+1)*5 + (3-r-c)*3) : null;
          s += '<rect x="'+(cx+2)+'" y="'+(cy+2)+'" width="'+(cs-4)+'" height="'+(cs-4)+'" rx="6" fill="#58a6ff'+(active?'22':'10')+'" stroke="#58a6ff" stroke-width="'+(active?1.5:0.7)+'"/>';
          s += '<text x="'+(cx+cs/2)+'" y="'+(cy+15)+'" text-anchor="middle" fill="#58a6ff" font-size="9.5" font-weight="700" font-family="Courier New,monospace">w'+r+c+'</text>';
          s += '<text x="'+(cx+cs/2)+'" y="'+(cy+33)+'" text-anchor="middle" fill="#8b949e" font-size="10" font-family="Courier New,monospace">\\u00d7a + p</text>';
          if (active) s += '<text x="'+(cx+cs/2)+'" y="'+(cy+52)+'" text-anchor="middle" fill="#d2a8ff" font-size="11" font-weight="700" font-family="Courier New,monospace">'+psum+'</text>';
          else s += '<text x="'+(cx+cs/2)+'" y="'+(cy+52)+'" text-anchor="middle" fill="#484f58" font-size="11">\\u2014</text>';
        }
        for (var r = 0; r < 4; r++) {
          var pillY = oy + r*cs + cs/2, aIdx = 3 - r;
          if (aIdx >= 0) {
            var px = ox - 56;
            s += '<rect x="'+px+'" y="'+(pillY-12)+'" width="46" height="22" rx="11" fill="#7ee78722" stroke="#7ee787" stroke-width="1.4"/>';
            s += '<text x="'+(px+23)+'" y="'+(pillY+4)+'" text-anchor="middle" fill="#7ee787" font-size="10" font-weight="700" font-family="Courier New,monospace">a'+r+aIdx+'</text>';
            s += '<line x1="'+(px+48)+'" y1="'+pillY+'" x2="'+(ox-2)+'" y2="'+pillY+'" stroke="#7ee78788" stroke-width="1.4"/>';
            s += '<polygon points="'+(ox-2)+','+(pillY-3)+' '+(ox-2)+','+(pillY+3)+' '+(ox+4)+','+pillY+'" fill="#7ee787"/>';
          }
        }
        for (var c = 0; c < 4; c++) {
          var pillX = ox + c*cs + cs/2, bIdx = 3 - c;
          if (bIdx >= 0) {
            var py = oy - 38;
            s += '<rect x="'+(pillX-23)+'" y="'+py+'" width="46" height="22" rx="11" fill="#ff7b7222" stroke="#ff7b72" stroke-width="1.4"/>';
            s += '<text x="'+pillX+'" y="'+(py+15)+'" text-anchor="middle" fill="#ff7b72" font-size="10" font-weight="700" font-family="Courier New,monospace">b'+bIdx+c+'</text>';
            s += '<line x1="'+pillX+'" y1="'+(py+22)+'" x2="'+pillX+'" y2="'+(oy-2)+'" stroke="#ff7b7288" stroke-width="1.4"/>';
            s += '<polygon points="'+(pillX-3)+','+(oy-2)+' '+(pillX+3)+','+(oy-2)+' '+pillX+','+(oy+4)+'" fill="#ff7b72"/>';
          }
        }
        var anX = ox + 4*cs + 18;
        s += '<text x="'+anX+'" y="'+(oy + 2*cs - 4)+'" fill="#58a6ff" font-size="11" font-weight="700">Weights</text>';
        s += '<text x="'+anX+'" y="'+(oy + 2*cs + 10)+'" fill="#58a6ff" font-size="11" font-weight="700">stationary</text>';
        s += '<text x="'+anX+'" y="'+(oy + 2*cs + 26)+'" fill="#8b949e" font-size="9">loaded once,</text>';
        s += '<text x="'+anX+'" y="'+(oy + 2*cs + 38)+'" fill="#8b949e" font-size="9">reused N\\u00d7 per</text>';
        s += '<text x="'+anX+'" y="'+(oy + 2*cs + 50)+'" fill="#8b949e" font-size="9">activation pass</text>';
        s += '<line x1="'+(ox+4*cs-2)+'" y1="'+(oy+2)+'" x2="'+(ox+2)+'" y2="'+(oy+4*cs-2)+'" stroke="#d2a8ff" stroke-width="0.8" stroke-dasharray="3,3" opacity="0.6"/>';
        s += '<text x="'+(ox+4*cs-12)+'" y="'+(oy+12)+'" text-anchor="end" fill="#d2a8ff" font-size="9" opacity="0.8">wavefront r+c = 3</text>';
        var ly = vbH - 26;
        s += '<g font-size="10">';
        s += '<rect x="60" y="'+ly+'" width="14" height="14" rx="2" fill="#7ee78722" stroke="#7ee787"/><text x="80" y="'+(ly+11)+'" fill="#c9d1d9">A inputs (stream \\u2192)</text>';
        s += '<rect x="220" y="'+ly+'" width="14" height="14" rx="2" fill="#ff7b7222" stroke="#ff7b72"/><text x="240" y="'+(ly+11)+'" fill="#c9d1d9">B inputs (stream \\u2193)</text>';
        s += '<rect x="380" y="'+ly+'" width="14" height="14" rx="2" fill="#58a6ff22" stroke="#58a6ff"/><text x="400" y="'+(ly+11)+'" fill="#c9d1d9">PE (stationary weight)</text>';
        s += '<rect x="570" y="'+ly+'" width="14" height="14" rx="2" fill="#d2a8ff44" stroke="#d2a8ff"/><text x="590" y="'+(ly+11)+'" fill="#c9d1d9">accumulating partial sum</text>';
        s += '</g></svg>';
        return s;
      },
      sections: [
        { title: "What is a systolic array?", text:
          'A systolic array is a 2D grid of multiply-accumulate units that does one big matrix multiply by passing data rhythmically from cell to cell. There is no instruction fetch, no register-file lookup, no branch \\u2014 just a wave of data sweeping through a fixed network of identical PEs once per clock.' +
          '<div class="dd-callout"><span class="dd-callout-icon">\\ud83d\\udca7</span><span><b>Bucket-brigade analogy:</b> imagine a line of people passing buckets of water. Each person does one tiny operation (add a cup) and hands the bucket on. The whole line works in lockstep \\u2014 that is exactly how a systolic array does a dot product.</span></div>' +
          '<svg class="dd-mini" viewBox="0 0 600 130" xmlns="http://www.w3.org/2000/svg" style="background:#0d1117;border:1px solid #30363d;border-radius:6px">' +
            '<text x="300" y="20" text-anchor="middle" fill="#c9d1d9" font-size="11" font-weight="700">1D systolic line: a dot product becomes a pipeline</text>' +
            '<rect x="20" y="55" width="70" height="22" rx="11" fill="#7ee78722" stroke="#7ee787"/>' +
            '<text x="55" y="70" text-anchor="middle" fill="#7ee787" font-size="10" font-family="Courier New,monospace">a\\u2080,a\\u2081,a\\u2082\\u2026</text>' +
            '<line x1="92" y1="66" x2="124" y2="66" stroke="#7ee787" stroke-width="1.4"/><polygon points="124,63 124,69 130,66" fill="#7ee787"/>' +
            '<rect x="132" y="50" width="80" height="36" rx="4" fill="#58a6ff15" stroke="#58a6ff" stroke-width="1.4"/>' +
            '<text x="172" y="73" text-anchor="middle" fill="#58a6ff" font-size="11" font-family="Courier New,monospace">PE w\\u2080</text>' +
            '<line x1="212" y1="66" x2="244" y2="66" stroke="#d2a8ff" stroke-width="1.4"/><polygon points="244,63 244,69 250,66" fill="#d2a8ff"/>' +
            '<rect x="252" y="50" width="80" height="36" rx="4" fill="#58a6ff15" stroke="#58a6ff" stroke-width="1.4"/>' +
            '<text x="292" y="73" text-anchor="middle" fill="#58a6ff" font-size="11" font-family="Courier New,monospace">PE w\\u2081</text>' +
            '<line x1="332" y1="66" x2="364" y2="66" stroke="#d2a8ff" stroke-width="1.4"/><polygon points="364,63 364,69 370,66" fill="#d2a8ff"/>' +
            '<rect x="372" y="50" width="80" height="36" rx="4" fill="#58a6ff15" stroke="#58a6ff" stroke-width="1.4"/>' +
            '<text x="412" y="73" text-anchor="middle" fill="#58a6ff" font-size="11" font-family="Courier New,monospace">PE w\\u2082</text>' +
            '<line x1="452" y1="66" x2="490" y2="66" stroke="#d2a8ff" stroke-width="1.4"/><polygon points="490,63 490,69 496,66" fill="#d2a8ff"/>' +
            '<rect x="500" y="55" width="80" height="22" rx="11" fill="#d2a8ff22" stroke="#d2a8ff"/>' +
            '<text x="540" y="70" text-anchor="middle" fill="#d2a8ff" font-size="10" font-family="Courier New,monospace">\\u03a3 w\\u1d62\\u00b7a\\u1d62</text>' +
            '<text x="55" y="105" text-anchor="middle" fill="#7ee787" font-size="10">activation in</text>' +
            '<text x="290" y="105" text-anchor="middle" fill="#58a6ff" font-size="10">each PE: psum += w \\u00b7 a</text>' +
            '<text x="540" y="105" text-anchor="middle" fill="#d2a8ff" font-size="10">dot product out</text>' +
          '</svg>'
        },
        { title: "Anatomy of a single PE", text:
          'Inside every cell sits the smallest possible compute unit: a register holding the stationary operand (the weight), a multiplier, an accumulator (adder + register), and pass-through latches that forward the neighbor data on the next clock edge. That is the entire microarchitecture \\u2014 thousands of these are tiled into the MXU.' +
          '<svg class="dd-mini" viewBox="0 0 540 290" xmlns="http://www.w3.org/2000/svg" style="background:#0d1117;border:1px solid #30363d;border-radius:6px">' +
            '<text x="270" y="22" text-anchor="middle" fill="#c9d1d9" font-size="12" font-weight="700">Inside one PE \\u2014 weight-stationary dataflow</text>' +
            '<rect x="150" y="70" width="240" height="170" rx="10" fill="#0d1117" stroke="#58a6ff" stroke-width="1.6"/>' +
            '<text x="270" y="90" text-anchor="middle" fill="#58a6ff" font-size="11" font-weight="700">PE</text>' +
            '<rect x="170" y="105" width="74" height="28" rx="4" fill="#58a6ff22" stroke="#58a6ff"/>' +
            '<text x="207" y="124" text-anchor="middle" fill="#58a6ff" font-size="10" font-family="Courier New,monospace">w (reg)</text>' +
            '<circle cx="305" cy="120" r="14" fill="#161b22" stroke="#ffa657" stroke-width="1.4"/>' +
            '<text x="305" y="125" text-anchor="middle" fill="#ffa657" font-size="14" font-weight="700">\\u00d7</text>' +
            '<circle cx="305" cy="190" r="14" fill="#161b22" stroke="#ffa657" stroke-width="1.4"/>' +
            '<text x="305" y="195" text-anchor="middle" fill="#ffa657" font-size="14" font-weight="700">+</text>' +
            '<line x1="244" y1="120" x2="291" y2="120" stroke="#58a6ff" stroke-width="1.2"/>' +
            '<line x1="305" y1="134" x2="305" y2="176" stroke="#ffa657" stroke-width="1.2"/>' +
            '<line x1="20" y1="155" x2="148" y2="155" stroke="#7ee787" stroke-width="2"/>' +
            '<polygon points="148,151 148,159 156,155" fill="#7ee787"/>' +
            '<text x="22" y="148" fill="#7ee787" font-size="10" font-weight="700">a_in</text>' +
            '<circle cx="170" cy="155" r="3" fill="#7ee787"/>' +
            '<line x1="170" y1="120" x2="170" y2="155" stroke="#7ee787" stroke-width="1" stroke-dasharray="2,2"/>' +
            '<line x1="170" y1="120" x2="207" y2="120" stroke="#7ee787" stroke-width="1" stroke-dasharray="2,2"/>' +
            '<text x="178" y="116" fill="#8b949e" font-size="8">to mult</text>' +
            '<line x1="170" y1="155" x2="510" y2="155" stroke="#7ee787" stroke-width="2"/>' +
            '<polygon points="510,151 510,159 518,155" fill="#7ee787"/>' +
            '<text x="490" y="148" text-anchor="end" fill="#7ee787" font-size="10" font-weight="700">a_out</text>' +
            '<line x1="305" y1="20" x2="305" y2="100" stroke="#d2a8ff" stroke-width="2"/>' +
            '<polygon points="301,100 309,100 305,108" fill="#d2a8ff"/>' +
            '<text x="313" y="32" fill="#d2a8ff" font-size="10" font-weight="700">psum_in</text>' +
            '<line x1="305" y1="108" x2="305" y2="176" stroke="#d2a8ff" stroke-width="1" stroke-dasharray="2,2"/>' +
            '<line x1="305" y1="204" x2="305" y2="278" stroke="#d2a8ff" stroke-width="2"/>' +
            '<polygon points="301,272 309,272 305,280" fill="#d2a8ff"/>' +
            '<text x="313" y="270" fill="#d2a8ff" font-size="10" font-weight="700">psum_out</text>' +
            '<g font-size="9">' +
              '<text x="20" y="265" fill="#7ee787">activation lane (passes through)</text>' +
              '<text x="20" y="278" fill="#d2a8ff">partial-sum lane (accumulates)</text>' +
              '<text x="400" y="278" fill="#58a6ff">stationary weight</text>' +
            '</g>' +
          '</svg>' +
          '<p style="font-size:12px;color:#8b949e;margin-top:6px">Every cycle, each PE does <b>exactly one MAC</b>: <code>psum_out = psum_in + w \\u00b7 a_in</code>. The activation passes east unchanged; the partial sum accumulates as it flows south. No branches, no caches, no scheduler.</p>'
        },
        { title: "Three dataflow styles", text:
          'Every systolic design picks <b>which operand stays put</b> and which two flow through. The choice trades data movement against PE register cost \\u2014 and dictates which workloads run efficiently.' +
          '<table class="dd-table"><thead><tr><th>Style</th><th>Stationary</th><th>Streaming</th><th>Used by</th><th>Trade-off</th></tr></thead><tbody>' +
            '<tr><td><b>Weight-stationary</b></td><td>Weights</td><td>Activations + partial sums</td><td>TPU MXU, Eyeriss-v2</td><td>Best when weights \\u226b activations (large dense matmul)</td></tr>' +
            '<tr><td><b>Output-stationary</b></td><td>Partial sums</td><td>Activations + weights</td><td>Some accelerators, ShiDianNao</td><td>Less psum movement; high reuse of accumulator</td></tr>' +
            '<tr><td><b>Input-stationary</b></td><td>Activations</td><td>Weights + partial sums</td><td>Some inference accelerators</td><td>Reuse activations across many filters</td></tr>' +
          '</tbody></table>'
        },
        { title: "Step-by-step animation (4 frames)", text:
          'Watch a 3\\u00d73 multiplication unfold cycle by cycle. Inputs are <b>skewed</b> on entry \\u2014 row <i>r</i> of A is delayed by <i>r</i> cycles, so they arrive at each PE at the right moment. Cell (r,c) starts accumulating at <code>t = r+c</code> and finishes at <code>t = r+c+K\\u22121</code> (here K=3). The diagonal wavefront sweeps from top-left to bottom-right.' +
          (function(){
            function frame(t) {
              var ox = 24, oy = 30, cs = 36;
              var s = '<svg viewBox="0 0 160 170" xmlns="http://www.w3.org/2000/svg" style="background:#0d1117;width:100%;display:block">';
              s += '<text x="80" y="18" text-anchor="middle" fill="#ffa657" font-size="11" font-weight="700" font-family="Courier New,monospace">t = '+t+'</text>';
              for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) {
                var x = ox + c*cs, y = oy + r*cs;
                var startT = r + c, endT = r + c + 3;
                var fill, stroke, label, txtCol;
                if (t < startT) { fill = '#21262d'; stroke = '#30363d'; label = '\\u2014'; txtCol = '#484f58'; }
                else if (t < endT) { fill = '#ffa65733'; stroke = '#ffa657'; label = (t-startT+1)+'/3'; txtCol = '#ffa657'; }
                else { fill = '#d2a8ff44'; stroke = '#d2a8ff'; label = '\\u2713'; txtCol = '#d2a8ff'; }
                s += '<rect x="'+(x+1)+'" y="'+(y+1)+'" width="'+(cs-2)+'" height="'+(cs-2)+'" rx="3" fill="'+fill+'" stroke="'+stroke+'" stroke-width="1"/>';
                s += '<text x="'+(x+cs/2)+'" y="'+(y+cs/2+4)+'" text-anchor="middle" fill="'+txtCol+'" font-size="10" font-weight="700" font-family="Courier New,monospace">'+label+'</text>';
              }
              return s + '</svg>';
            }
            return '<div class="dd-grid" style="grid-template-columns:repeat(4,minmax(120px,1fr))">' +
              '<div class="dd-tile">'+frame(0)+'<div style="font-size:10px;color:#8b949e;text-align:center;margin-top:4px">first MAC at (0,0)</div></div>' +
              '<div class="dd-tile">'+frame(2)+'<div style="font-size:10px;color:#8b949e;text-align:center;margin-top:4px">wavefront on diagonal</div></div>' +
              '<div class="dd-tile">'+frame(4)+'<div style="font-size:10px;color:#8b949e;text-align:center;margin-top:4px">first cell finishes (\\u2713)</div></div>' +
              '<div class="dd-tile">'+frame(6)+'<div style="font-size:10px;color:#8b949e;text-align:center;margin-top:4px">all 9 PEs done</div></div>' +
            '</div>';
          })() +
          '<div class="dd-callout"><span class="dd-callout-icon">\\u23f1\\ufe0f</span><span><b>Why the staircase?</b> If row 1 of A entered at the same time as row 0, both would arrive at PE (1,0) on the same cycle and collide. Delaying row r by r cycles guarantees that each PE sees the matched (a, b) pair. Total runtime: <b>K + 2N \\u2212 2</b> cycles for an N\\u00d7N array on a K-deep dot product.</span></div>'
        },
        { title: "Why it\\u2019s energy-efficient", text:
          'In modern silicon, <b>data movement dominates ML energy</b> \\u2014 a DRAM access burns ~1000\\u00d7 the energy of a single MAC. Systolic arrays minimize that movement by keeping operands inside the array and reusing them many times before they leave.' +
          '<svg class="dd-mini" viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg" style="background:#0d1117;border:1px solid #30363d;border-radius:6px">' +
            '<text x="300" y="20" text-anchor="middle" fill="#c9d1d9" font-size="12" font-weight="700">Energy per operation \\u2014 log scale (Horowitz, ISSCC 2014)</text>' +
            (function(){
              var ops = [
                { n: 'DRAM read (32-bit word)', v: 200,  c: '#ff7b72' },
                { n: 'SRAM read (32 KB)',       v: 5,    c: '#ffa657' },
                { n: 'FP16 multiply-add',       v: 0.2,  c: '#58a6ff' },
                { n: 'INT8 multiply-add',       v: 0.03, c: '#7ee787' }
              ];
              var s = '', x0 = 220, baseY = 40, barH = 28, gap = 6;
              var maxLog = Math.log10(200), minLog = Math.log10(0.03), maxBarW = 320;
              for (var i = 0; i < ops.length; i++) {
                var y = baseY + i*(barH+gap);
                var bw = Math.max(8, ((Math.log10(ops[i].v) - minLog) / (maxLog - minLog)) * maxBarW);
                s += '<text x="'+(x0-10)+'" y="'+(y+barH/2+4)+'" text-anchor="end" fill="#c9d1d9" font-size="11">'+ops[i].n+'</text>';
                s += '<rect x="'+x0+'" y="'+y+'" width="'+bw+'" height="'+barH+'" rx="3" fill="'+ops[i].c+'33" stroke="'+ops[i].c+'" stroke-width="1.4"/>';
                s += '<text x="'+(x0+bw+6)+'" y="'+(y+barH/2+4)+'" fill="'+ops[i].c+'" font-size="11" font-weight="700" font-family="Courier New,monospace">'+ops[i].v+' pJ</text>';
              }
              return s;
            })() +
            '<text x="300" y="190" text-anchor="middle" fill="#8b949e" font-size="10">DRAM access burns ~1000\\u00d7 the energy of an INT8 MAC \\u2014 movement, not math, dominates</text>' +
          '</svg>' +
          '<div class="dd-callout"><span class="dd-callout-icon">\\ud83d\\udd0b</span><span><b>The reuse math:</b> an N\\u00d7N array does <b>N\\u00b2 MACs</b> per cycle but only needs <b>2N memory loads</b> (one row of A, one column of B). Each weight is reused N times across activations and each activation is reused N times across columns \\u2014 a 128\\u00d7128 MXU multiplies arithmetic intensity by 128.</span></div>'
        },
        { title: "Mapping a matmul", text:
          'A matrix multiply <code>C = A \\u00b7 B</code> maps onto the array by streaming rows of A horizontally and columns of B vertically. For an M\\u00d7K \\u00b7 K\\u00d7N multiply on an N\\u00d7N array, you tile both M and N into blocks of size N and walk K through the array.' +
          '<div class="dd-formula">C[i][j] = \\u03a3<sub>k</sub> A[i][k] \\u00d7 B[k][j]</div>' +
          '<pre class="dd-code"><span class="c"># Logical view of the TPU MXU \\u2014 one cycle</span>\\n<span class="k">for</span> i <span class="k">in</span> range(<span class="n">128</span>):\\n  <span class="k">for</span> j <span class="k">in</span> range(<span class="n">128</span>):\\n    psum[i][j] += a_row[i][cycle] * weight[i][j]\\n\\n<span class="c"># In hardware: all 128\\u00d7128 = 16,384 MACs happen in parallel</span>\\n<span class="c"># every clock; the loops above are just the *meaning* of one cycle.</span></pre>' +
          '<p style="font-size:12px;color:#8b949e;margin-top:6px">TPU v1 used a single <b>256\\u00d7256 MXU</b> doing INT8 MACs (65,536 ops/cycle). From v2 onward each TensorCore has <b>two 128\\u00d7128 MXUs</b> doing BF16\\u00d7BF16 with FP32 accumulation \\u2014 the same 2\\u00d716,384 = 32,768 MACs/cycle, but split for better utilization on smaller batches.</p>'
        },
        { title: "Limits and tile padding", text:
          'A systolic array is a fixed N\\u00d7N tile of silicon. When the math fits exactly, every PE is busy every cycle. When it doesn\\u2019t, the unused PEs still burn area and (a little) power \\u2014 they just don\\u2019t do useful work.' +
          '<svg class="dd-mini" viewBox="0 0 380 220" xmlns="http://www.w3.org/2000/svg" style="background:#0d1117;border:1px solid #30363d;border-radius:6px">' +
            '<text x="190" y="22" text-anchor="middle" fill="#c9d1d9" font-size="12" font-weight="700">3\\u00d73 problem mapped onto a 4\\u00d74 array</text>' +
            (function(){
              var ox = 110, oy = 50, cs = 38, s = '';
              for (var r = 0; r < 4; r++) for (var c = 0; c < 4; c++) {
                var x = ox + c*cs, y = oy + r*cs, used = (r < 3 && c < 3);
                s += '<rect x="'+(x+1)+'" y="'+(y+1)+'" width="'+(cs-2)+'" height="'+(cs-2)+'" rx="3" fill="'+(used?'#58a6ff22':'#21262d')+'" stroke="'+(used?'#58a6ff':'#30363d')+'" stroke-width="1"/>';
                s += '<text x="'+(x+cs/2)+'" y="'+(y+cs/2+4)+'" text-anchor="middle" fill="'+(used?'#58a6ff':'#484f58')+'" font-size="9" font-family="Courier New,monospace">'+(used?'MAC':'idle')+'</text>';
              }
              s += '<text x="190" y="218" text-anchor="middle" fill="#8b949e" font-size="10">9 of 16 PEs busy = <tspan fill="#ff7b72" font-weight="700">56%</tspan> utilization on this step</text>';
              return s;
            })() +
          '</svg>' +
          '<div class="dd-callout" style="border-left-color:#ff7b72"><span class="dd-callout-icon">\\u26a0\\ufe0f</span><span><b>Watch for shape changes:</b> XLA caches a compiled program per shape. If your inference server sees many different sequence lengths, padding to a small set of buckets (e.g. 128, 256, 512, 1024) keeps utilization high <i>and</i> avoids constant recompilation.</span></div>'
        },
        { title: "Alternatives & related designs", text:
          'Systolic arrays are not the only way to build a dense-matmul engine. The two main competitors take different points on the same trade-off curve: NVIDIA\\u2019s <b>Tensor Cores</b> use small warp-scoped tiles wired into a much more flexible SIMT pipeline, while <b>Cerebras WSE</b> takes the idea to its logical extreme with a wafer-scale 2D fabric.' +
          '<div class="dd-grid">' +
            '<div class="dd-tile"><h4>NVIDIA Tensor Core</h4>' +
              '<div class="dd-spec"><span>Tile size</span><b>4\\u00d74\\u00d74 MMA</b></div>' +
              '<div class="dd-spec"><span>Scope</span><b>warp (32 thr.)</b></div>' +
              '<div class="dd-spec"><span>Strength</span><b>flexibility</b></div>' +
              '<p style="font-size:11px;color:#8b949e;margin-top:6px">Many small MMA units per SM, programmable from CUDA \\u2014 great when shapes vary.</p></div>' +
            '<div class="dd-tile"><h4>AMD Matrix Cores</h4>' +
              '<div class="dd-spec"><span>Tile size</span><b>16\\u00d716\\u00d74 MFMA</b></div>' +
              '<div class="dd-spec"><span>Found in</span><b>CDNA / MI300</b></div>' +
              '<div class="dd-spec"><span>Strength</span><b>throughput</b></div>' +
              '<p style="font-size:11px;color:#8b949e;margin-top:6px">Wave-level matrix-fused-multiply-add; conceptually similar to TensorCore.</p></div>' +
            '<div class="dd-tile"><h4>Cerebras WSE-3</h4>' +
              '<div class="dd-spec"><span>Topology</span><b>2D wafer mesh</b></div>' +
              '<div class="dd-spec"><span>Cores</span><b>900K</b></div>' +
              '<div class="dd-spec"><span>Strength</span><b>scale</b></div>' +
              '<p style="font-size:11px;color:#8b949e;margin-top:6px">Whole-wafer fabric \\u2014 not strictly systolic, but the same dataflow philosophy at extreme scale.</p></div>' +
          '</div>' +
          '<div class="dd-links">' +
            '<a href="https://www.eecs.harvard.edu/~htk/publication/1982-kung-why-systolic-architecture.pdf" target="_blank">Kung 1982 \\u2014 Why systolic?</a>' +
            '<a href="https://arxiv.org/abs/1704.04760" target="_blank">Jouppi et al. \\u2014 TPU v1 ISCA 2017</a>' +
            '<a href="https://images.nvidia.com/aem-dam/Solutions/Data-Center/a100/nvidia-ampere-architecture-whitepaper.pdf" target="_blank">NVIDIA Ampere whitepaper (Tensor Cores)</a>' +
            '<a href="https://www.cerebras.ai/product-chip" target="_blank">Cerebras WSE-3</a>' +
          '</div>'
        }
      ],
      keypoints: [
        { title: "Massive parallelism", text: "All N\\u00b2 PEs compute simultaneously \\u2014 a 128\\u00d7128 MXU does 16,384 MACs every clock cycle." },
        { title: "Data reuse", text: "Each loaded weight is reused N times and each activation N times \\u2014 N\\u00b2 MACs for only 2N memory loads." },
        { title: "Deterministic latency", text: "Fixed pipeline depth (K + 2N \\u2212 2 cycles) gives predictable, schedule-friendly execution." },
        { title: "Dense workloads only", text: "Best on big dense matmuls; sparse, irregular, or shape-changing work leaves PEs idle." },
        { title: "TPU evolution", text: "v1 = single 256\\u00d7256 INT8 MXU; v2+ = dual 128\\u00d7128 MXUs with BF16 multiply / FP32 accumulate." },
        { title: "Same idea, smaller tiles", text: "NVIDIA Tensor Cores use the same dataflow at 4\\u00d74\\u00d74 warp scope \\u2014 systolic ideas live everywhere." }
      ]
    },
`;

// Validate card 1
try {
  const fn = new Function('return [' + card1Src.replace(/,\s*$/, '') + ']');
  const arr = fn();
  console.log('Card 1 OK: id=', arr[0].id, 'sections=', arr[0].sections.length, 'keypoints=', arr[0].keypoints.length);
} catch (e) {
  console.error('Card 1 PARSE ERROR:', e.message);
  process.exit(1);
}

// Save card 1 source to disk for next step
fs.writeFileSync(path.join(__dirname, '_card1.txt'), card1Src);
console.log('Wrote _card1.txt, length=', card1Src.length);
