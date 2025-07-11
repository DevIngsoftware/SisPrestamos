
$(document).ready(function () {

    function updateFileName() {
        var fileInput = document.getElementById('logo');
        var fileName = fileInput.files.length > 0 ? fileInput.files[0].name : 'Ningún archivo seleccionado';
        document.querySelector('.file-name').textContent = fileName;
    }


    document.getElementById('searchForm').addEventListener('submit', function (event) {
        event.preventDefault();
        var userId = document.getElementById('searchInput').value;
        // Simulación de búsqueda del usuario
        // En un entorno real, aquí se realizaría una solicitud al servidor para buscar el usuario


        if (userId) {
            // Simulación de respuesta del servidor
            document.getElementById('userForm').style.display = 'block';
            document.getElementById('userName').value = 'Nombre del Usuario'; // Reemplazar con datos reales
            document.getElementById('userEmail').value = 'usuario@ejemplo.com'; // Reemplazar con datos reales
            document.getElementById('userPhone').value = '123-456-7890'; // Reemplazar con datos reales
        }
    });


})
