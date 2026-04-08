export default function Bio() {
  return (
    <section className="section section--hero" id="bio">
      <div className="column">
        <div className="bio-photo">
          <img src="/assets/profile.jpg" alt="Mayuresh Naidu" />
        </div>
        <p className="bio">
          <strong>Mayuresh Naidu</strong> is a designer and software engineer in Toronto, ON.
          He is currently a member of the development team at{' '}
          <a href="https://lodestone.pm"><strong>Lodestone</strong></a>,
          working across full-stack systems, product design, and developer tooling.
        </p>
        <p className="bio">
          He received his Bachelors degree in Computer Science from{' '}
          <a href="https://mitwpu.edu.in/"><strong>MIT Pune</strong></a> and his PG Diploma
          in Web Development from <a href="https://humber.ca"><strong>Humber Polytechnic</strong></a>.
        </p>
        <div className="social-links" role="list">
          <a href="https://github.com/meiyo99" className="social-link" role="listitem" target="_blank" rel="noopener noreferrer">GitHub</a>
          <span className="social-dot" aria-hidden="true">·</span>
          <a href="https://www.linkedin.com/in/mayureshnaidu/" className="social-link" role="listitem" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <span className="social-dot" aria-hidden="true">·</span>
          <a href="https://x.com/notmeiyo" className="social-link" role="listitem" target="_blank" rel="noopener noreferrer">X / Twitter</a>
          <span className="social-dot" aria-hidden="true">·</span>
          <a href="mailto:mayureshnaiduu@gmail.com" className="social-link" role="listitem">Email</a>
          <span className="social-dot" aria-hidden="true">·</span>
          <a href="https://drive.google.com/file/d/1Tmryvo_VdUm5WSAfHJI4c4cM26BBunw4/view?usp=sharing" className="social-link" role="listitem" target="_blank" rel="noopener noreferrer">Resume</a>
        </div>
      </div>
    </section>
  )
}
