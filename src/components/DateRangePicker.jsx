import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

const DateRangePicker = ({ fechaInicio, fechaFin, onChange }) => {
  const inicio = fechaInicio ? new Date(fechaInicio + 'T00:00:00') : null
  const fin = fechaFin ? new Date(fechaFin + 'T00:00:00') : null

  const handleChange = (dates) => {
    const [start, end] = dates
    onChange({
      fechaInicio: start ? start.toISOString().slice(0, 10) : '',
      fechaFin: end ? end.toISOString().slice(0, 10) : '',
    })
  }

  return (
    <div style={{ fontFamily: 'inherit' }}>
      <DatePicker
        selected={inicio}
        onChange={handleChange}
        startDate={inicio}
        endDate={fin}
        selectsRange
        inline
        minDate={new Date()}
        dateFormat="yyyy-MM-dd"
        className="form-control input-cream"
      />
    </div>
  )
}

export default DateRangePicker
