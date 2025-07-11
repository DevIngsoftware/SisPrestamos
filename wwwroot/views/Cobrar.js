let idPrestamo = 0;
let totalPagar = 0;
let prestamosEncontrados = [];
window.filasCancelado = null;
$(document).ready(function () {
    // Manejo del clic en el botón de búsqueda
    $("#btnBuscar").on("click", function () {

       $.LoadingOverlay("show");
        buscar();

    });

    document.getElementById('txtNroDocumento').addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            $.LoadingOverlay("show");
            buscar();
        }
    });

    document.getElementById('txtBRecibo').addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            var numeropago = parseInt($("#txtBRecibo").val(), 10);

            if (window.filasCancelado == null) return
            if (numeropago > window.filasCancelado.length || numeropago <= 0 || isNaN(numeropago)) return;
            Imprimir(numeropago);
           
        }
    });


    function buscar() {
        window.filasCancelado = null;
        const nroDocumento = $("#txtNroDocumento").val().trim();

        if (!nroDocumento) {
            $.LoadingOverlay("hide");
            Swal.fire({
                title: "Ups!",
                text: "Debe ingresar un número de documento.",
                icon: "warning"
            });
            return;
        }


        fetch(`/Prestamo/ObtenerPrestamos?IdPrestamo=0&NroDocumento=${encodeURIComponent(nroDocumento)}`, {
            method: "GET",
            headers: { 'Content-Type': 'application/json;charset=utf-8' }
        })
            .then(response => response.ok ? response.json() : Promise.reject(response))
            .then(responseJson => {
                handlePrestamosResponse(responseJson);

            })
            .catch(() => {
                Swal.fire({
                    title: "Error!",
                    text: "No se encontraron resultados.",
                    icon: "warning"
                });
            });
        $.LoadingOverlay("hide");
    }


    // Manejo del clic en el botón de registrar pago
    $("#btnAplicarPago").on("click", function () {
        
        AplicarPago(false);
        
        
    });

    // Pagar e Imprimir
    $("#btnAplicarEImprimir").on("click", function () {
        AplicarPago(true);
        
    });


    $("#btnBustarEImprimir").on("click", function () {
        var numeropago = parseInt($("#txtBRecibo").val(), 10);
        if (window.filasCancelado == null) return
        if (numeropago > window.filasCancelado.length || numeropago <= 0 || isNaN(numeropago)) return;

        Imprimir(numeropago);

    });

    function AplicarPago(imprime) {
        if (idPrestamo === 0) {
            Swal.fire({
                title: "Error!",
                text: "No hay préstamo encontrado",
                icon: "warning"
            });
            return false;
        }

        if (totalPagar === 0) {
            Swal.fire({
                title: "Error!",
                text: "No hay cuotas seleccionadas",
                icon: "warning"
            });
            return false;
        }

        const cuotasSeleccionadas = $(".checkPagado").serializeArray().map(e => e.name).join(",");

        return fetch(`/Cobrar/PagarCuotas?idPrestamo=${idPrestamo}&nroCuotasPagadas=${encodeURIComponent(cuotasSeleccionadas)}`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json;charset=utf-8' }
        })
            .then(response => response.ok ? response.json() : Promise.reject(response))
            .then(responseJson => {
                if (!responseJson.data) {

                    if (imprime) {
                        buscar();
                        Swal.fire({
                            title: "Listo!",
                            text: "Pagos Aplicados con Éxito.",
                            icon: "success",
                            showCancelButton: true,
                            confirmButtonText: 'Imprimir',
                            cancelButtonText: 'Cerrar',
                        }).then((result) => {
                            if (result.isConfirmed) {

                                //Inicia
                                function checkboxImprimir() {
                                    const table = document.getElementById('tbDetalle');
                                    if (!table) {
                                        console.error('No se encontró la tabla con ID tbDetalle');
                                        return;
                                    }

                                    const checkboxes = table.querySelectorAll('input[type="checkbox"]');
                                    let lastCheckedValue = null;

                                    checkboxes.forEach(checkbox => {
                                        if (checkbox.checked) {
                                            lastCheckedValue = parseInt(checkbox.getAttribute('name'), 10);
                                            if (isNaN(lastCheckedValue)) {
                                                lastCheckedValue = null;
                                                
                                            }
                                        }
                                    });

                                    if (lastCheckedValue !== null) {

                                        Imprimir(lastCheckedValue);
                                        Limpiar(false);
                                    }
                                }
                                checkboxImprimir();
                            }
                        });
                        return true;


                    } else {

                        Swal.fire({
                            title: "Listo!",
                            text: "Pagos Aplicados con Exito.",
                            icon: "success"
                        });
                        Limpiar(false);
                        return true;

                    }


                } else {
                    Swal.fire({
                        title: "Error!",
                        text: responseJson.data,
                        icon: "warning"
                    });
                    return false;
                }
            })
            .catch(() => {
                Swal.fire({
                    title: "Error!",
                    text: "No se pudo registrar.",
                    icon: "warning"
                });
                return false;
            });
    }

    $("#btnGuardar").on("click", function () {
        function getCheckedCheckboxId() {
            const table = document.getElementById('tbPrestamosEncontrados');
            const checkboxes = table.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    const idPrestamo = parseInt(checkbox.id, 10);
                    const prestamo = prestamosEncontrados.find(e => e.idPrestamo === idPrestamo);
                    if (prestamo) {
                        mostrarPrestamo(prestamo);
                        obtenerUltimasFilasCancelado(prestamo);
                        $("#mdData").modal('hide');
                    }
                }
            });
        }
        getCheckedCheckboxId();
    });



    // Manejo del cambio en los checkboxes de cuotas pagadas
    $(document).on('click', '.checkPagado', function () {
        const monto = parseFloat($(this).data("monto"));
        totalPagar = $(this).is(":checked") ? totalPagar + monto : totalPagar - monto;
        $("#txtTotalaPagar").val(totalPagar.toFixed(2));
    });
});

function Imprimir(numeropago) {
    if (!window.filasCancelado.length) return;// Solo imprime si hay filas canceladas

        if (isNaN(numeropago)) {
        let ultimo = window.filasCancelado.length - 1;
        const [nroCuota, fechaDePago, montoCuota, fechaPagado] = window.filasCancelado[ultimo];
        const estado = window.filasCancelado[0][ultimo];
        } else {

        ultimo = numeropago - 1;
        [nroCuota, fechaDePago, montoCuota, fechaPagado] = window.filasCancelado[ultimo];
        estado = window.filasCancelado[0][ultimo];
        $("#txtBRecibo").val("");
    }

     const params = {
        idPago: $("#txtNroPrestamo").val(),
        Cedula: $("#txtNroDocumento").val(),
        nombreDelCliente: $("#txtNombreCliente").val(),
        MontoPrestado: $("#txtMontoPrestamo").val(),
        Interes: $("#txtInteres").val(),
        NumeroCuotas: $("#txtNroCuotas").val(),
        MontoTotal: $("#txtMontoTotal").val(),
        ModalidadDePago: $("#txtFormadePago").val(),
        TipoMoneda: $("#txtTipoMoneda").val(),
        nroCuota,
        fechaDePago,
        montoCuota,
        estado,
        fechaPagado
    };

    const queryString = $.param(params);
    const url = `/Prestamo/ImprimirPago?${queryString}`;

    printJS({
        printable: url,
        type: 'pdf',
        showModal: true
    });
}


function handlePrestamosResponse(responseJson) {
    if (responseJson.data.length === 0) {
        Limpiar(false);
        Swal.fire({
            title: "Ups!",
            text: "No se encontró un cliente.",
            icon: "warning"
        });
        return;
    }

    if (responseJson.data.length === 1) {
        const dataFiltro = responseJson.data.filter(e => e.estado === "Pendiente");
        const prestamo = dataFiltro.length ? dataFiltro[0] : responseJson.data.find(e => e.estado === "Cancelado");
        mostrarPrestamo(prestamo);
        obtenerUltimasFilasCancelado(prestamo);
    } else {
        
        Limpiar(false);
        prestamosEncontrados = responseJson.data;
        $("#tbPrestamosEncontrados tbody").html("");
        responseJson.data.forEach(e => {
            $("#tbPrestamosEncontrados tbody").append(`
                <tr>
                    <td><input type="checkbox" class="form-check-input" id="${e.idPrestamo}"/></td>
                    <td>${e.idPrestamo}</td>
                    <td>${e.montoPrestamo}</td>
                    <td>${e.estado === "Pendiente" ? '<span class="badge bg-danger p-2">Pendiente</span>' : '<span class="badge bg-success p-2">Cancelado</span>'}</td>
                    <td>${e.fechaCreacion}</td>
                </tr>

            `);
        });
        $("#mdData").modal('show');
        
    }

}

function Limpiar(limpiarNroDocumento) {
    if (limpiarNroDocumento) $("#txtNroDocumento").val("");
    idPrestamo = 0;
    totalPagar = 0;
    $("#txtNroPrestamo, #txtNombreCliente, #txtMontoPrestamo, #txtInteres, #txtNroCuotas, #txtMontoTotal, #txtFormadePago, #txtTipoMoneda, #txtTotalaPagar").val("");
    $("#tbDetalle tbody").html("");
}

function mostrarPrestamo(prestamo) {
    idPrestamo = prestamo.idPrestamo;
    $("#txtNroPrestamo").val(prestamo.idPrestamo);
    $("#txtNombreCliente").val(`${prestamo.cliente.nombre} ${prestamo.cliente.apellido}`);
    $("#txtMontoPrestamo").val(prestamo.montoPrestamo);
    $("#txtInteres").val(prestamo.interesPorcentaje);
    $("#txtNroCuotas").val(prestamo.nroCuotas);
    $("#txtMontoTotal").val(prestamo.valorTotal);
    $("#txtFormadePago").val(prestamo.formaDePago);
    $("#txtTipoMoneda").val(prestamo.moneda.nombre);
    $("#tbDetalle tbody").html("");

    prestamo.prestamoDetalle.forEach(e => {
        const isChecked = e.estado === 'Cancelado' ? 'disabled checked' : '';
        const clase = e.estado === 'Cancelado' ? '' : 'checkPagado';
        $("#tbDetalle tbody").append(`
            <tr>
                <td><input class="form-check-input ${clase}" type="checkbox" name="${e.nroCuota}" data-monto="${e.montoCuota}" data-idprestamodetalle="${e.idPrestamoDetalle}" ${isChecked}/></td>
                <td>${e.nroCuota}</td>
                <td>${e.fechaPago}</td>
                <td>${e.montoCuota}</td>
                <td>${e.estado === "Pendiente" ? '<span class="badge bg-danger p-2">Pendiente</span>' : '<span class="badge bg-success p-2">Cancelado</span>'}</td>
                <td>${e.fechaPagado}</td>
            </tr>
        `);
    });
}

function obtenerUltimasFilasCancelado(prestamo) {
    const cancelados = prestamo.prestamoDetalle.filter(e => e.estado === 'Cancelado');
    const indiceUltimoCancelado = cancelados.map((e, index) => e.estado === 'Cancelado' ? index : -1).filter(index => index !== -1).pop();

    if (indiceUltimoCancelado !== undefined) {
        window.filasCancelado = cancelados.map(e => [
            e.nroCuota,
            e.fechaPago,
            e.montoCuota,
            e.fechaPagado,
            e.estado === 'Pendiente' ? 'Pendiente' : 'Cancelado'
            
        ]);
    }

}
