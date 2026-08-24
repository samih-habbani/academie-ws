export default function Footer() {
  return (
    <footer className="footer-futuriste">
      <div className="f-logo">Académie<em>WS</em></div>
      <div className="f-links">
        <a href="#">Mentions légales</a>
        <a href="#">CGU</a>
        <a href="#">Contact</a>
      </div>
      <div className="f-copy">© {new Date().getFullYear()} Académie WS · Tous droits réservés</div>
    </footer>
  )
}
