import { Component, inject } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <section class="dashboard">
      <div class="dashboard-heading">
        <div>
          <p class="eyebrow"><span class="eyebrow-line"></span> YOUR WORKSPACE</p>
          <h1>A clearer view<br>of <span>what’s next.</span></h1>
          <p class="intro">Your processes and priorities will find their home here.</p>
        </div>
        <div class="dashboard-art" aria-hidden="true">
          <div class="art-orbit orbit-one"></div>
          <div class="art-orbit orbit-two"></div>
          <div class="art-core"><span></span><span></span><span></span></div>
        </div>
      </div>

      <div class="dashboard-grid">
        <article class="welcome-card">
          <div class="welcome-icon" aria-hidden="true">✳</div>
          <div>
            <p class="eyebrow">YOUR NEXT CHAPTER</p>
            <h2>Your workspace is ready to take shape.</h2>
            <p>Organize your work into clear, connected processes. This is where your team’s next steps come together.</p>
          </div>
        </article>
        <article class="stat-card">
          <span class="stat-label">PROCESS OVERVIEW</span>
          <span class="stat-value">A fresh start</span>
          <span class="stat-note">Your work will appear here</span>
          <div class="stat-rule"><span></span></div>
        </article>
      </div>
    </section>
  `,
})
export class DashboardComponent {}
