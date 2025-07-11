let tablaData;
let idEditar = 0;
const controlador = "Prestamo";
const confirmaRegistro = "Prestamo registrado!";

let idCliente = 0;

document.addEventListener("DOMContentLoaded", function (event) {
    $.LoadingOverlay("show");
    fetch(`/Moneda/Lista`, {
        method: "GET",
        headers: { 'Content-Type': 'application/json;charset=utf-8' }
    }).then(response => {
        return response.ok ? response.json() : Promise.reject(response);
    }).then(responseJson => {
        $.LoadingOverlay("hide");
        if (responseJson.data.length > 0) {
            responseJson.data.forEach((item) => {
                $("#cboTipoMoneda").append($("<option>").val(item.idMoneda).text(item.nombre));
            });
        }
    }).catch((error) => {
        $.LoadingOverlay("hide");
        Swal.fire({
            title: "Error!",
            text: "No se pudo eliminar.",
            icon: "warning"
        });
    })



    document.getElementById('txtNroDocumento').addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            event.preventDefault(); // Previene el comportamiento por defecto del Enter, si es necesario
            $("#btnBuscar").click();
        }
    });




    $("#btnBuscar").on("click", function () {

        if ($("#txtNroDocumento").val() == "") {
            Swal.fire({
                title: "Ups!",
                text: "Debe ingresar un numero de documento.",
                icon: "warning"
            });
            return;
        }

        $("#cardCliente").LoadingOverlay("show");

        fetch(`/${controlador}/ObtenerCliente?NroDocumento=${$("#txtNroDocumento").val()}`, {
            method: "GET",
            headers: { 'Content-Type': 'application/json;charset=utf-8' }
        }).then(response => {
            return response.ok ? response.json() : Promise.reject(response);
        }).then(responseJson => {
            $("#cardCliente").LoadingOverlay("hide");
            if (responseJson.data.idCliente != 0) {

                const cliente = responseJson.data;
                idCliente = cliente.idCliente;
                $("#txtNombre").val(cliente.nombre);
                $("#txtApellido").val(cliente.apellido);
                $("#txtCorreo").val(cliente.correo);
                $("#txtTelefono").val(cliente.telefono);


            } else {
                $("#txtNombre").val('');
                $("#txtApellido").val('');
                $("#txtCorreo").val('');
                $("#txtTelefono").val('');
                Swal.fire({
                    title: "No se encontro un cliente registrado",
                    text: `Desea registrar manualmente?`,
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#3085d6",
                    cancelButtonColor: "#d33",
                    confirmButtonText: "Si, continuar",
                    cancelButtonText: "No, volver"
                }).then((result) => {
                    if (result.isConfirmed) {
                        idCliente = 0;
                        $("#txtNombre").removeAttr('disabled');
                        $("#txtApellido").removeAttr('disabled');
                        $("#txtCorreo").removeAttr('disabled');
                        $("#txtTelefono").removeAttr('disabled');
                    }
                });
            }
        }).catch((error) => {
            $("#cardCliente").LoadingOverlay("hide");
            Swal.fire({
                title: "Error!",
                text: "No se pudo eliminar.",
                icon: "warning"
            });
        })

    })


    // Manejar el evento click del botón de calcular
    $("#btnCalcular").on("click", function () {
        const inputsPrestamo = $(".data-prestamo").serializeArray();
        const inputText = inputsPrestamo.find((e) => e.value === "");

        if (inputText != undefined) {
            Swal.fire({
                title: "Error!",
                text: `Debe completar el campo: ${inputText.name.replaceAll("_", " ")}`,
                icon: "warning"
            });
            return;
        }

        const montoPrestamo = parseFloat(inputsPrestamo.find((e) => e.name === "Monto_Prestamo").value);
        const interesMensual = parseFloat(inputsPrestamo.find((e) => e.name === "Interes").value) / 100; // Convertir a decimal
        const nroCuotas = parseInt(inputsPrestamo.find((e) => e.name === "NroCuotas").value);

        // Calcular la cuota fija usando la fórmula de amortización
        let cuota = montoPrestamo * interesMensual / (1 - Math.pow(1 + interesMensual, -nroCuotas));

        let saldo = montoPrestamo;
        let totalInteres = 0;

        for (let i = 0; i < nroCuotas; i++) {
            const interesCuota = saldo * interesMensual;
            const capitalCuota = cuota - interesCuota;
            saldo -= capitalCuota;

            if (i === nroCuotas - 1) {
                saldo = Math.max(saldo, 0);
                cuota = saldo + interesCuota + capitalCuota;
            }

            totalInteres += interesCuota;
        }

        const montoTotal = montoPrestamo + totalInteres;

        $("#txtMontoInteres").val(totalInteres.toFixed(2));
        $("#txtMontoPorCuota").val(cuota.toFixed(2));
        $("#txtMontoTotal").val(montoTotal.toFixed(2));

        window.interes = totalInteres;
        window.total = montoTotal;
        window.montocuota = cuota;

        llenarAmortizacion();
    });

    $("#btnRegistrar").on("click", function () {
        const inputs = $(".data-in").serializeArray();
        const inputText = inputs.find((e) => e.value == "");

        if (idCliente == 0) {
            if (inputText != undefined) {
                Swal.fire({
                    title: "Error!",
                    text: `Debe completar el campo: ${inputText.name.replaceAll("_", " ")}`,
                    icon: "warning"
                });
                return
            }
        }


        if ($("#txtMontoTotal").val() == "") {
            Swal.fire({
                title: "Error!",
                text: `Debe completar el detalle del prestamo`,
                icon: "warning"
            });
            return
        }


        const objeto = {
            Cliente: {
                IdCliente: idCliente,
                NroDocumento: $("#txtNroDocumento").val(),
                Nombre: $("#txtNombre").val(),
                Apellido: $("#txtApellido").val(),
                Correo: $("#txtCorreo").val(),
                Telefono: $("#txtTelefono").val()
            },
            Moneda: {
                IdMoneda: $("#cboTipoMoneda").val()
            },
            FechaInicioPago: moment($("#txtFechaInicio").val()).format("DD/MM/YYYY"),
            MontoPrestamo: $("#txtMontoPrestamo").val(),
            InteresPorcentaje: $("#txtInteres").val(),
            NroCuotas: $("#txtNroCuotas").val(),
            FormaDePago: $("#cboFormaPago").val(),
            ValorPorCuota: $("#txtMontoPorCuota").val(),
            ValorInteres: $("#txtMontoInteres").val(),
            ValorTotal: $("#txtMontoTotal").val()
        }

        fetch(`/${controlador}/Crear`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json;charset=utf-8' },
            body: JSON.stringify(objeto)
        }).then(response => {
            return response.ok ? response.json() : Promise.reject(response);
        }).then(responseJson => {
            if (responseJson.data == "") {

                idCliente = 0;
                $(".data-in").val("");
                $(".data-prestamo").val("");
                $("#cboTipoMoneda").val($("#cboTipoMoneda option:first").val());
                $("#cboFormaPago").val($("#cboFormaPago option:first").val());

                Swal.fire({
                    title: "Listo!",
                    text: confirmaRegistro,
                    icon: "success"
                });
            } else {
                Swal.fire({
                    title: "Error!",
                    text: responseJson.data,
                    icon: "warning"
                });
            }
        }).catch((error) => {
            Swal.fire({
                title: "Error!",
                text: "No se pudo registrar.",
                icon: "warning"
            });
        })
    })

    function formatCurrency(amount) {
        return `$${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    function formatDate(date) {
        return moment(date).format("DD/MM/YYYY");
    }

    function parseDate(dateString) {
        return moment(dateString, "DD/MM/YYYY").format("YYYY-MM-DD");
    }

    function llenarAmortizacion() {
        if (window.interes !== undefined && window.total !== undefined && window.montocuota !== undefined) {
            const tbAmortizacion = $("#tbAmortizacion tbody");
            tbAmortizacion.empty(); // Limpiar la tabla antes de llenarla

            const montoPrestamo = parseFloat($("input[name='Monto_Prestamo']").val());
            const interesMensual = parseFloat($("input[name='Interes']").val()) / 100; // Convertir a decimal
            const nroCuotas = parseInt($("input[name='NroCuotas']").val());


            const formaPago = $("#cboFormaPago").val(); // Obtener la forma de pago

            // Obtener la fecha de inicio desde txtFechaInicio y convertir a formato YYYY-MM-DD
            const fechaInicio = moment($("#txtFechaInicio").val(), "YYYY-MM-DD");


            if (!fechaInicio.isValid()) {
                Swal.fire({
                    title: "Error",
                    text: "La fecha de inicio es inválida. Asegúrese de que esté en formato DD/MM/YYYY.",
                    icon: "warning"
                });
                return;
            }


            let saldoRestante = montoPrestamo;

            let sumaCapital = 0;
            let sumaInteres = 0;
            let sumaCuotaTotal = 0;

            for (let i = 1; i <= nroCuotas; i++) {  // Cambiar el índice a 1 basado en el contador de cuotas
                const interesCuota = saldoRestante * interesMensual;
                const capitalCuota = window.montocuota - interesCuota;
                saldoRestante -= capitalCuota;

                let fechaCuota;
                switch (formaPago) {
                    case "Diario":
                        fechaCuota = fechaInicio.clone().add(i - 1, 'days').format("DD/MM/YYYY");
                        break;
                    case "Semanal":
                        fechaCuota = fechaInicio.clone().add((i - 1) * 7, 'days').format("DD/MM/YYYY");
                        break;
                    case "Quincenal":
                        fechaCuota = fechaInicio.clone().add((i - 1) * 15, 'days').format("DD/MM/YYYY");
                        break;
                    case "Mensual":
                    default:
                        fechaCuota = fechaInicio.clone().add(i - 1, 'months').format("DD/MM/YYYY");
                        break;
                }

                sumaCapital += capitalCuota;
                sumaInteres += interesCuota;
                sumaCuotaTotal += window.montocuota;

                const row = `
                <tr>
                    <td>${i}</td>
                    <td>${formatCurrency(window.montocuota)}</td>
                    <td>${formatCurrency(interesCuota)}</td>
                    <td>${formatCurrency(capitalCuota)}</td>
                    <td>${formatCurrency(saldoRestante)}</td>
                    <td>${fechaCuota}</td>
                </tr>
            `;

                tbAmortizacion.append(row);


                Swal.fire({
                    title: "Tabla Generada",
                    text: "La tabla de amortización se ha generado con éxito.",
                    icon: "success"
                });
            }

            // Añadir la fila de totales al final de la tabla
            const rowTotales = `
            <tr>
                <td><strong>Total</strong></td>
                <td><strong>${formatCurrency(sumaCuotaTotal)}</strong></td>
                <td><strong>${formatCurrency(sumaInteres)}</strong></td>
                <td><strong>${formatCurrency(sumaCapital)}</strong></td>
                <td></td>
                <td></td>
            </tr>
        `;
            tbAmortizacion.append(rowTotales);

        } else {
            Swal.fire({
                title: "Error",
                text: "Primero debe calcular el préstamo.",
                icon: "warning"
            });
        }

    }

})