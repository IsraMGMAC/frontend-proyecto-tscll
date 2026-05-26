const FAQPage = () => {
  return (
    <div className="container py-4">
      <div className="app-hero">
        <h1 className="app-title fade-in">Preguntas frecuentes</h1>
        <p className="app-subtitle fade-in-delay">
          Respuestas a las dudas mas comunes sobre nuestro servicio de renta.
        </p>
      </div>

      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">
          <div className="card-surface p-4">
            <div>
              <h5 className="fw-semibold">¿Como hago una reserva?</h5>
              <p className="small-muted mb-0">Inicia sesion como cliente, navega por el catalogo, selecciona los equipos que necesitas y agregalos al carrito. Luego elige las fechas de renta y realiza el pago.</p>
            </div>
            <div className="mt-4">
              <h5 className="fw-semibold">¿Que metodos de pago aceptan?</h5>
              <p className="small-muted mb-0">Aceptamos pagos en efectivo, tarjeta de credito/debito y PayPal.</p>
            </div>
            <div className="mt-4">
              <h5 className="fw-semibold">¿Cuanto tiempo dura la renta minima?</h5>
              <p className="small-muted mb-0">La renta minima es de un dia. Puedes rentar por periodos mas largos segun tu necesidad.</p>
            </div>
            <div className="mt-4">
              <h5 className="fw-semibold">¿Puedo cancelar mi reserva?</h5>
              <p className="small-muted mb-0">Si. Con mas de 48 horas de anticipacion el reembolso es del 100%. Entre 24 y 48 horas es del 50%. Menos de 24 horas no aplica reembolso.</p>
            </div>
            <div className="mt-4">
              <h5 className="fw-semibold">¿Hacen entregas a domicilio?</h5>
              <p className="small-muted mb-0">Si, ofrecemos envio a domicilio con costo adicional. Tambien puedes recoger el equipo en nuestra sucursal.</p>
            </div>
            <div className="mt-4">
              <h5 className="fw-semibold">¿Que pasa si el equipo se dana durante mi evento?</h5>
              <p className="small-muted mb-0">Los daños se evaluan al momento de la devolucion y se descuentan del deposito de garantia. Si el costo excede el deposito, se factura la diferencia al cliente.</p>
            </div>
            <div className="mt-4">
              <h5 className="fw-semibold">¿Puedo extender el periodo de renta?</h5>
              <p className="small-muted mb-0">Si, las extensiones deben solicitarse con al menos 24 horas de anticipacion y estan sujetas a disponibilidad.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FAQPage
