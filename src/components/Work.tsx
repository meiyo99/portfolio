export default function Work() {
  return (
    <section className="section section--work" id="work">
      <div className="column">
        <h2 className="section-heading">Work</h2>
        <div className="work-list">

          <div className="work-item">
            <div className="work-icon">
              <img src="/assets/icons/lodestone.jpeg" alt="" loading="lazy" />
            </div>
            <div className="work-body">
              <div className="work-meta">
                <span className="work-company">Lodestone</span>
                <span className="work-period">Sep 2025 – present</span>
              </div>
              <span className="work-role">Full-Stack Developer</span>
            </div>
          </div>

          <div className="work-item">
            <div className="work-icon">
              <img src="/assets/icons/gebbs.jpg" alt="" loading="lazy" />
            </div>
            <div className="work-body">
              <div className="work-meta">
                <span className="work-company">GeBBS Healthcare</span>
                <span className="work-period">Sep 2021 – Sep 2023</span>
              </div>
              <span className="work-role">Software Engineer</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
