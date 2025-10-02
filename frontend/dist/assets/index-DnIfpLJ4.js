(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))r(t);new MutationObserver(t=>{for(const a of t)if(a.type==="childList")for(const i of a.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&r(i)}).observe(document,{childList:!0,subtree:!0});function o(t){const a={};return t.integrity&&(a.integrity=t.integrity),t.referrerPolicy&&(a.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?a.credentials="include":t.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function r(t){if(t.ep)return;t.ep=!0;const a=o(t);fetch(t.href,a)}})();function c(){const e=document.createElement("section");return e.className="page home",e.innerHTML=`
    <section class="hero">
      <div class="container">
        <h1>Name your product in minutes.</h1>
        <p class="sub">A minimalist naming tool for founders and indie hackers.</p>
        <div class="actions">
          <a class="btn btn-primary" href="https://portal.nameo.dev" target="_blank" rel="noopener">Open Portal</a>
          <a class="btn" href="#/pricing">See Pricing</a>
        </div>
      </div>
    </section>

    <section class="features container">
      <div class="feature">
        <h3>Simple</h3>
        <p>Clean interface focused on results, not distractions.</p>
      </div>
      <div class="feature">
        <h3>Fast</h3>
        <p>Optimized suggestions with minimal latency.</p>
      </div>
      <div class="feature">
        <h3>Available</h3>
        <p>Check domain availability and social handle ideas.</p>
      </div>
    </section>
  `,e}function l(){const e=document.createElement("section");return e.className="page help container",e.innerHTML=`
    <h1>Help</h1>
    <p>Getting started is simple: create an account in the portal and start generating names.</p>
    <h2>FAQ</h2>
    <details>
      <summary>Where do I access the tool?</summary>
      <p>Use the <a href="https://portal.nameo.dev" target="_blank" rel="noopener">portal</a>.</p>
    </details>
    <details>
      <summary>How do I get support?</summary>
      <p>Email <a href="mailto:support@nameo.dev">support@nameo.dev</a> or <a href="https://portal.nameo.dev/support/tickets" target="_blank" rel="noopener">submit a ticket</a> in the portal.</p>
    </details>
  `,e}function d(){const e=document.createElement("section");return e.className="page login container",e.innerHTML=`
    <h1>Login</h1>
    <p>Authentication is handled in the portal.</p>
    <a class="btn btn-primary" href="https://portal.nameo.dev/login" target="_blank" rel="noopener">Continue to Portal Login</a>
  `,e}function p(){const e=document.createElement("section");return e.className="page pricing container",e.innerHTML=`
    <h1>Pricing</h1>
    <div class="plans">
      <div class="plan">
        <h3>Starter</h3>
        <p class="price">$5/mo</p>
        <ul>
          <li>Limited suggestions</li>
          <li>Basic checks</li>
        </ul>
        <a class="btn btn-primary" href="https://portal.nameo.dev/signup" target="_blank" rel="noopener">Get Started</a>
      </div>
      <div class="plan">
        <h3>Pro</h3>
        <p class="price">$15/mo</p>
        <ul>
          <li>Unlimited suggestions</li>
          <li>Advanced checks</li>
        </ul>
        <a class="btn btn-primary" href="https://portal.nameo.dev/signup" target="_blank" rel="noopener">Start Free Trial</a>
      </div>
    </div>
  `,e}function m(){const e=document.createElement("section");return e.className="page privacy container",e.innerHTML=`
    <h1>Privacy Policy</h1>
    <p>We value your privacy. This placeholder will be updated before GA.</p>
  `,e}function u(){const e=document.createElement("section");return e.className="page terms container",e.innerHTML=`
    <h1>Terms of Service</h1>
    <p>Basic terms placeholder. Subject to change.</p>
  `,e}function h(){const e=document.createElement("section");return e.className="page notfound container",e.innerHTML=`
    <h1>Page not found</h1>
    <p>The page you are looking for does not exist.</p>
    <a class="btn" href="#/">Go Home</a>
  `,e}const g={"/":c,"/help":l,"/login":d,"/pricing":p,"/privacy":m,"/terms":u};function f(){return(window.location.hash||"#/").slice(1)}const s={outlet:null,mount(e){this.outlet=e,this.navigate()},navigate(){if(!this.outlet)return;const e=f(),n=g[e]||h;this.outlet.innerHTML="",this.outlet.appendChild(n()),window.scrollTo(0,0)}};function v(){const e=document.createElement("header");e.className="site-header";const n=document.createElement("a");n.href="#/",n.className="brand",n.textContent="nameo.dev";const o=document.createElement("nav");o.className="site-nav",o.innerHTML=`
    <a href="#/pricing">Pricing</a>
    <a href="#/help">Help</a>
    <a href="#/login" class="btn btn-primary">Login</a>
  `;const r=document.createElement("button");return r.className="theme-toggle",r.title="Toggle dark mode",r.textContent="🌓",r.addEventListener("click",()=>{document.documentElement.classList.toggle("dark"),localStorage.setItem("theme",document.documentElement.classList.contains("dark")?"dark":"light")}),localStorage.getItem("theme")==="dark"&&document.documentElement.classList.add("dark"),e.appendChild(n),e.appendChild(o),e.appendChild(r),e}function b(){const e=document.createElement("footer");return e.className="site-footer",e.innerHTML=`
    <div class="container">
      <div class="left">© ${new Date().getFullYear()} nameo.dev</div>
      <div class="right">
        <a href="https://portal.nameo.dev" target="_blank" rel="noopener">Portal</a>
        <a href="mailto:support@nameo.dev">Email Support</a>
        <a href="https://portal.nameo.dev/support/tickets" target="_blank" rel="noopener">Submit a Ticket</a>
      </div>
    </div>
  `,e}function y(){const e=document.getElementById("app");e.innerHTML="";const n=v(),o=document.createElement("main");o.id="main",o.setAttribute("role","main");const r=b();e.appendChild(n),e.appendChild(o),e.appendChild(r),s.mount(o)}window.addEventListener("hashchange",()=>s.navigate());window.addEventListener("DOMContentLoaded",y);
//# sourceMappingURL=index-DnIfpLJ4.js.map
