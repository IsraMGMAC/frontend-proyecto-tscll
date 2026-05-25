const ConditionsPage = () => {
  return (
    <div className="container py-4">
      <div className="app-hero">
        <h1 className="app-title fade-in">Condiciones de renta</h1>
        <p className="app-subtitle fade-in-delay">
          Terminos y condiciones generales para el alquiler de equipo para eventos.
        </p>
      </div>

      <div className="card-surface p-4">
        <h2 className="section-title">1. Proceso de reserva</h2>
        <p className="small-muted">
          Para realizar una reserva, el cliente debe seleccionar los equipos deseados, indicar las fechas de renta
          y realizar el pago correspondiente. Una vez confirmado el pago, se generara un codigo de reserva unico.
        </p>

        <h2 className="section-title mt-4">2. Pago</h2>
        <p className="small-muted">
          Se aceptan pagos en efectivo, tarjeta de credito/debito y PayPal. El pago minimo inicial es del 50%
          del total de la renta. El saldo restante debe liquidarse al momento de la entrega del equipo.
        </p>

        <h2 className="section-title mt-4">3. Plazos de renta</h2>
        <p className="small-muted">
          La renta minima es de un dia. El periodo de renta se contabiliza a partir de la hora de entrega
          hasta la hora de devolucion acordada. Las extensiones deben solicitarse con al menos 24 horas de anticipacion.
        </p>

        <h2 className="section-title mt-4">4. Entrega y devolucion</h2>
        <p className="small-muted">
          La entrega puede ser en sucursal (recoleccion) o envio a domicilio. Los costos de envio se calculan
          segun la distancia. La devolucion debe realizarse en la misma modalidad.
        </p>

        <h2 className="section-title mt-4">5. Cancelaciones</h2>
        <p className="small-muted">
          Las cancelaciones con mas de 48 horas de anticipacion tienen reembolso del 100%.
          Entre 24 y 48 horas el reembolso es del 50%. Menos de 24 horas no aplica reembolso.
        </p>

        <h2 className="section-title mt-4">6. Responsabilidad</h2>
        <p className="small-muted">
          El cliente es responsable del cuidado y correcto uso del equipo durante el periodo de renta.
          Cualquier daño o perdida sera facturado al cliente.
        </p>
      </div>
    </div>
  )
}

export default ConditionsPage
