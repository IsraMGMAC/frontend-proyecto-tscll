import { useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import api from '../services/api'

const ProductCalendar = ({ equipoId, fechaInicio, fechaFin, onChange }) => {
  const [disponibles, setDisponibles] = useState({})
  const [loading, setLoading] = useState(true)
  const [mesActual, setMesActual] = useState(new Date())

  const inicio = fechaInicio ? new Date(fechaInicio + 'T00:00:00') : null
  const fin = fechaFin ? new Date(fechaFin + 'T00:00:00') : null

  const cargarMes = (fecha) => {
    const year = fecha.getFullYear()
    const m = fecha.getMonth()
    const desde = `${year}-${String(m + 1).padStart(2, '0')}-01`
    const ultimo = new Date(year, m + 1, 0).getDate()
    const hasta = `${year}-${String(m + 1).padStart(2, '0')}-${String(ultimo).padStart(2, '0')}`

    setLoading(true)
    api.get(`/equipos/${equipoId}/disponibilidad-diaria`, {
      params: { fechaInicio: desde, fechaFin: hasta },
    }).then((res) => {
      setDisponibles(res.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => {
    cargarMes(mesActual)
  }, [equipoId, mesActual])

  const handleChange = (dates) => {
    const [start, end] = dates
    onChange({
      fechaInicio: start ? start.toISOString().slice(0, 10) : '',
      fechaFin: end ? end.toISOString().slice(0, 10) : '',
    })
  }

  const renderDay = (day, date) => {
    const dateStr = date.toISOString().slice(0, 10)
    const disp = disponibles[dateStr]
    return (
      <div style={{ position: 'relative', textAlign: 'center' }}>
        <div>{date.getDate()}</div>
        {disp !== undefined ? (
          <div style={{
            fontSize: 10, fontWeight: 600, lineHeight: 1,
            color: disp > 0 ? '#2e7d32' : '#d32f2f',
            marginTop: 1,
          }}>
            {disp}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="product-calendar-wrapper" style={{ fontFamily: 'inherit' }}>
      <DatePicker
        selected={inicio}
        onChange={handleChange}
        startDate={inicio}
        endDate={fin}
        selectsRange
        inline
        minDate={new Date()}
        onMonthChange={(d) => setMesActual(d)}
        renderDayContents={renderDay}
        dateFormat="yyyy-MM-dd"
      />
    </div>
  )
}

export default ProductCalendar
