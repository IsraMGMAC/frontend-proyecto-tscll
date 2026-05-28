const AboutPage = () => {
  return (
    <div className="container py-4">
      <div className="app-hero">
        <h1 className="app-title fade-in">Nosotros</h1>
        <p className="app-subtitle fade-in-delay">
          Conoce más sobre Renta Eventos y nuestro compromiso con la calidad.
        </p>
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-6">
          <div className="card-surface p-4 h-100">
            <h2 className="section-title">Quiénes somos</h2>
            <p className="small-muted">
              Renta Eventos es una empresa especializada en el alquiler de equipo profesional para todo tipo
              de eventos: bodas, conferencias, conciertos, festivales y reuniones sociales.
            </p>
            <p className="small-muted">
              Contamos con más de 5 años de experiencia en el sector, ofreciendo equipos de audio, iluminación
              y mobiliario de las mejores marcas del mercado.
            </p>
          </div>
        </div>
        <div className="col-12 col-lg-6">
          <div className="card-surface p-4 h-100">
            <h2 className="section-title">Misión</h2>
            <p className="small-muted">
              Proveer a nuestros clientes el equipo necesario para que sus eventos sean todo un éxito,
              ofreciendo calidad, confiabilidad y el mejor servicio.
            </p>
          </div>
        </div>
        <div className="col-12 col-lg-6">
          <div className="card-surface p-4 h-100">
            <h2 className="section-title">Visión</h2>
            <p className="small-muted">
              Ser la empresa líder en renta de equipo para eventos en la región, reconocida por la calidad
              de nuestros equipos y la excelencia en el servicio al cliente.
            </p>
          </div>
        </div>
        <div className="col-12 col-lg-6">
          <div className="card-surface p-4 h-100">
            <h2 className="section-title">Contacto</h2>
            <p className="small-muted">
              Email: contacto@rentaeventos.com<br />
              Teléfono: 555-123-4567<br />
              Dirección: Av. Reforma 123, Col. Centro, CDMX
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AboutPage
