<style>
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        backdrop-filter: blur(2px);
    }

    .modal-content {
        background: #1a1a1a;
        border-radius: 12px;
        width: 90%;
        max-width: 900px;
        max-height: 90vh;
        overflow: hidden;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
        border: 1px solid #333;
        display: flex;
        flex-direction: column;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px;
        border-bottom: 1px solid #333;
        background: #242424;
        flex-shrink: 0;
    }

    .modal-header h2 {
        margin: 0;
        color: #ffffff;
        font-size: 1.25rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .icon {
        font-size: 1.2em;
    }

    .close-btn {
        background: none;
        border: none;
        color: #a4b0be;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s ease;
    }

    .close-btn:hover {
        background-color: #ff4757;
        color: white;
    }

    .modal-body {
        padding: 24px;
        color: #ffffff;
        overflow-y: auto;
        flex: 1;
    }

    .success-alert {
        background: rgba(46, 213, 115, 0.1);
        border: 1px solid #2ed573;
        border-radius: 8px;
        padding: 12px 16px;
        color: #2ed573;
        margin-bottom: 16px;
        font-size: 14px;
    }

    .error-alert {
        background: rgba(255, 71, 87, 0.1);
        border: 1px solid #ff4757;
        border-radius: 8px;
        padding: 16px;
        color: #ff4757;
        margin-bottom: 16px;
    }

    .error-alert h4 {
        margin: 0 0 8px 0;
        font-size: 16px;
    }

    .error-alert p {
        margin: 0 0 12px 0;
    }

    .loading-container {
        text-align: center;
        padding: 40px;
        color: #a4b0be;
    }

    .spinner {
        display: inline-block;
        width: 32px;
        height: 32px;
        border: 2px solid #3498db;
        border-radius: 50%;
        border-top-color: transparent;
        animation: spin 1s linear infinite;
        margin-bottom: 16px;
    }

    .loading-spinner {
        display: inline-block;
        width: 14px;
        height: 14px;
        border: 2px solid currentColor;
        border-radius: 50%;
        border-top-color: transparent;
        animation: spin 1s linear infinite;
        margin-right: 6px;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .tabs {
        display: flex;
        border-bottom: 1px solid #333;
        margin-bottom: 24px;
    }

    .tab-btn {
        background: none;
        border: none;
        color: #a4b0be;
        padding: 12px 20px;
        cursor: pointer;
        border-bottom: 2px solid transparent;
        transition: all 0.2s ease;
        font-size: 14px;
        font-weight: 500;
    }

    .tab-btn:hover {
        color: #ffffff;
    }

    .tab-btn.active {
        color: #3498db;
        border-bottom-color: #3498db;
    }

    .tab-content {
        min-height: 400px;
    }

    .section {
        margin-bottom: 32px;
    }

    .section-title {
        margin: 0 0 16px 0;
        color: #ffffff;
        font-size: 18px;
        font-weight: 600;
        border-bottom: 1px solid #333;
        padding-bottom: 8px;
    }

    .empty-state {
        text-align: center;
        padding: 40px 20px;
        color: #a4b0be;
        background: #242424;
        border-radius: 8px;
    }

    .comments-list {
        margin-bottom: 24px;
    }

    .comment-card {
        background: #242424;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
        border: 1px solid #333;
    }

    .comment-header {
        display: flex;
        align-items: center;
        margin-bottom: 12px;
        position: relative;
    }

    .comment-meta {
        flex: 1;
    }

    .comment-actions {
        display: flex;
        gap: 4px;
        margin-left: 8px;
    }

    .action-btn {
        background: none;
        border: 1px solid transparent;
        color: #a4b0be;
        cursor: pointer;
        padding: 4px 6px;
        border-radius: 4px;
        font-size: 12px;
        transition: all 0.2s ease;
        min-width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .action-btn:hover:not(:disabled) {
        background-color: rgba(255, 255, 255, 0.1);
    }

    .action-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .edit-btn:hover:not(:disabled) {
        color: #3498db;
        border-color: #3498db;
    }

    .delete-btn:hover:not(:disabled) {
        color: #ff4757;
        border-color: #ff4757;
    }

    .delete-btn.confirm {
        background-color: #ff4757;
        color: white;
        border-color: #ff4757;
    }

    .save-btn:hover:not(:disabled) {
        color: #2ed573;
        border-color: #2ed573;
    }

    .cancel-btn:hover:not(:disabled) {
        color: #ff6b35;
        border-color: #ff6b35;
    }

    .edit-comment-textarea {
        width: 100%;
        min-height: 60px;
        padding: 8px;
        border: 1px solid #363636;
        border-radius: 4px;
        background-color: #1a1a1a;
        color: #ffffff;
        font-size: 14px;
        font-family: inherit;
        resize: vertical;
        transition: border-color 0.2s ease;
    }

    .edit-comment-textarea:focus {
        outline: none;
        border-color: #3498db;
        box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
    }

    .user-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 600;
        font-size: 14px;
        margin-right: 12px;
        flex-shrink: 0;
    }

    .comment-meta h6 {
        margin: 0;
        color: #ffffff;
        font-size: 14px;
        font-weight: 600;
    }

    .comment-meta small {
        color: #a4b0be;
        font-size: 12px;
    }

    .comment-content p {
        margin: 0;
        color: #ffffff;
        line-height: 1.5;
        white-space: pre-wrap;
    }

    .comment-form {
        background: #2a2a2a;
        border-radius: 8px;
        padding: 16px;
        border: 1px solid #363636;
    }

    .comment-textarea {
        width: 100%;
        min-height: 80px;
        padding: 12px;
        border: 1px solid #363636;
        border-radius: 6px;
        background-color: #1a1a1a;
        color: #ffffff;
        font-size: 14px;
        font-family: inherit;
        resize: vertical;
        transition: border-color 0.2s ease;
    }

    .comment-textarea:focus {
        outline: none;
        border-color: #3498db;
        box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
    }

    .comment-textarea::placeholder {
        color: #666;
    }

    .attachments-list {
        margin-bottom: 24px;
    }

    .attachment-card {
        background: #242424;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
        border: 1px solid #333;
    }

    .attachment-header {
        display: flex;
        align-items: flex-start;
        margin-bottom: 12px;
    }

    .file-icon {
        font-size: 24px;
        margin-right: 12px;
        flex-shrink: 0;
    }

    .attachment-info {
        flex: 1;
        min-width: 0;
    }

    .attachment-info h6 {
        margin: 0 0 4px 0;
        color: #ffffff;
        font-size: 14px;
        font-weight: 600;
        word-break: break-word;
    }

    .attachment-meta {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .file-size {
        color: #a4b0be;
        font-size: 12px;
        font-weight: 600;
        background: #363636;
        padding: 2px 6px;
        border-radius: 4px;
        display: inline-block;
        width: fit-content;
    }

    .file-date {
        color: #a4b0be;
        font-size: 12px;
    }

    .attachment-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }

    .upload-form {
        background: #2a2a2a;
        border-radius: 8px;
        padding: 16px;
        border: 1px solid #363636;
    }

    .file-input {
        width: 100%;
        padding: 8px;
        border: 1px solid #363636;
        border-radius: 6px;
        background-color: #1a1a1a;
        color: #ffffff;
        font-size: 14px;
        margin-bottom: 12px;
    }

    .file-input:focus {
        outline: none;
        border-color: #3498db;
    }

    .progress-bar {
        position: relative;
        height: 24px;
        background-color: #363636;
        border-radius: 12px;
        overflow: hidden;
        margin-bottom: 12px;
    }

    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #3498db, #2ecc71);
        transition: width 0.3s ease;
    }

    .progress-text {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: #ffffff;
        font-size: 12px;
        font-weight: 600;
    }

    .form-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 12px;
    }

    .btn {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        line-height: 1.4;
    }

    .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .btn-primary {
        background-color: #3498db;
        color: white;
    }

    .btn-primary:hover:not(:disabled) {
        background-color: #2980b9;
    }

    .btn-secondary {
        background-color: #6c757d;
        color: white;
    }

    .btn-secondary:hover:not(:disabled) {
        background-color: #5a6268;
    }

    .btn-outline {
        background-color: transparent;
        color: #3498db;
        border: 1px solid #3498db;
    }

    .btn-outline:hover:not(:disabled) {
        background-color: #3498db;
        color: white;
    }

    .btn-sm {
        padding: 6px 12px;
        font-size: 12px;
    }

    .btn-danger {
        background-color: #ff4757;
        color: white;
    }

    .btn-danger:hover:not(:disabled) {
        background-color: #ff3742;
    }

    .btn-danger.confirm {
        background-color: #ff3742;
        animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }

    .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding: 16px 24px;
        border-top: 1px solid #333;
        background: #242424;
        flex-shrink: 0;
    }

    @media (max-width: 768px) {
        .modal-content {
            width: 95%;
            margin: 20px;
            max-height: 95vh;
        }

        .modal-header {
            padding: 16px 20px;
        }

        .modal-header h2 {
            font-size: 1.1rem;
        }

        .modal-body {
            padding: 20px;
        }

        .tabs {
            margin-bottom: 20px;
        }

        .tab-btn {
            padding: 10px 16px;
            font-size: 13px;
        }

        .section-title {
            font-size: 16px;
        }

        .comment-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
        }

        .comment-actions {
            align-self: flex-end;
            margin-left: 0;
            margin-top: 8px;
        }

        .user-avatar {
            margin-right: 8px;
        }

        .attachment-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
        }

        .file-icon {
            margin-right: 0;
            margin-bottom: 4px;
        }

        .attachment-actions {
            margin-top: 8px;
        }

        .btn {
            width: 100%;
            justify-content: center;
        }

        .attachment-actions .btn {
            width: auto;
            flex: 1;
        }

        .modal-footer {
            padding: 12px 20px;
        }

        .modal-footer .btn {
            width: 100%;
        }
    }

    @media (max-width: 480px) {
        .tabs {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
        }

        .tab-btn {
            white-space: nowrap;
            min-width: 100px;
        }

        .attachment-meta {
            gap: 4px;
        }

        .file-size {
            font-size: 11px;
        }

        .file-date {
            font-size: 11px;
        }
    }
</style>
    <script lang="ts">
    import { onMount } from 'svelte';
    import api from '../lib/api';
    import type { Comment, Attachment, Task } from '../lib/types/task';

    // Props
    export let isOpen = false;
    export let taskId: number | null = null;
    export let taskTitle = 'Tarea';
    export let onClose: () => void;

    // Estados
    let comments: Comment[] = [];
    let attachments: Attachment[] = [];
    let task: Task | null = null;
    let newComment = '';
    let selectedFile: File | null = null;
    let loading = false;
    let error: string | null = null;
    let activeTab = 'all';
    let uploadProgress = 0;
    let showSuccessMessage = false;
    let successMessage = '';
    let downloadLoading = false;

    // Estados para edición
    let editingCommentId: number | null = null;
    let editCommentText = '';
    let deletingCommentId: number | null = null;
    let deletingAttachmentId: number | null = null;

    // Obtener usuario del localStorage
    const storedUser = localStorage.getItem("user");
    const user = storedUser ? JSON.parse(storedUser) : null;
    const userId = user?.id || 0;

    // Cargar datos cuando se abre el modal
    async function loadTaskData() {
        if (!taskId) return;

        try {
            loading = true;
            error = null;

            // Obtener detalles de la tarea
            const taskResponse = await api.get(`/tasks/${taskId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            task = taskResponse.data;

            // Obtener comentarios y adjuntos
            try {
                const response = await api.get(`/comments/task/${taskId}/all`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                
                comments = response.data.comments || [];
                attachments = response.data.attachments || [];
            } catch (err) {
                console.error('Error al cargar comentarios y adjuntos:', err);
                
                // Intentar cargar por separado
                try {
                    const commentsResponse = await api.get(`/comments/task/${taskId}`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    comments = commentsResponse.data || [];
                } catch (commErr) {
                    console.error('Error al cargar comentarios:', commErr);
                }
                
                try {
                    const attachmentsResponse = await api.get(`/comments/attachments/task/${taskId}`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    attachments = attachmentsResponse.data || [];
                } catch (attachErr) {
                    console.error('Error al cargar adjuntos:', attachErr);
                }
            }
        } catch (err) {
            console.error('Error al cargar datos:', err);
            error = 'No se pudieron cargar los comentarios y archivos adjuntos. Inténtalo de nuevo.';
        } finally {
            loading = false;
        }
    }

    // Manejar envío de comentario
    async function handleSubmitComment(e: Event) {
        e.preventDefault();
        
        if (!taskId || !newComment.trim()) return;
        
        try {
            loading = true;
            error = null;
            
            const commentData = {
                task_id: taskId,
                user_id: userId,
                content: newComment.trim()
            };
            
            const response = await api.post('/comments', commentData, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            
            // Añadir el nuevo comentario a la lista
            comments = [response.data, ...comments];
            newComment = '';
            
            // Mostrar mensaje de éxito
            showSuccess('Comentario añadido correctamente');
        } catch (err) {
            console.error('Error al añadir comentario:', err);
            error = 'Error al añadir comentario. Por favor, inténtalo de nuevo.';
        } finally {
            loading = false;
        }
    }

    // Manejar cambio de archivo
    function handleFileChange(e: Event) {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
            selectedFile = target.files[0];
        }
    }

    // Manejar subida de archivo
    async function handleUploadFile(e: Event) {
        e.preventDefault();
        
        if (!taskId || !selectedFile) return;
        
        try {
            loading = true;
            error = null;
            uploadProgress = 0;
            
            // Crear FormData para enviar el archivo
            const formData = new FormData();
            formData.append('file', selectedFile);
            
            // Simular progreso de subida (axios no siempre reporta progreso en el navegador)
            const progressInterval = setInterval(() => {
                uploadProgress = Math.min(uploadProgress + 10, 90);
            }, 100);
            
            // Subir el archivo
            const uploadResponse = await api.post(`/upload/task/${taskId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                }
            });
            
            clearInterval(progressInterval);
            uploadProgress = 100;
            
            // Crear el registro de archivo adjunto
            const attachmentData = {
                task_id: taskId,
                user_id: userId,
                filename: uploadResponse.data.filename,
                originalName: uploadResponse.data.originalName,
                path: uploadResponse.data.path,
                mimeType: uploadResponse.data.mimeType,
                size: uploadResponse.data.size
            };
            
            const response = await api.post('/comments/attachments', attachmentData, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            
            // Añadir el archivo a la lista
            attachments = [response.data, ...attachments];
            
            // Resetear el formulario
            selectedFile = null;
            const fileInput = document.getElementById('fileInput') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
            
            // Mostrar mensaje de éxito
            showSuccess('Archivo adjunto añadido correctamente');
        } catch (err) {
            console.error('Error al subir archivo:', err);
            error = 'Error al subir el archivo. Por favor, inténtalo de nuevo.';
        } finally {
            loading = false;
            uploadProgress = 0;
        }
    }

    // Mostrar mensaje de éxito
    function showSuccess(message: string) {
        successMessage = message;
        showSuccessMessage = true;
        setTimeout(() => showSuccessMessage = false, 3000);
    }

    // Iniciar edición de comentario
    function startEditComment(comment: Comment) {
        editingCommentId = comment.id;
        editCommentText = comment.content;
    }

    // Cancelar edición de comentario
    function cancelEditComment() {
        editingCommentId = null;
        editCommentText = '';
    }

    // Guardar comentario editado
    async function saveEditComment() {
        if (!editingCommentId || !editCommentText.trim()) return;

        try {
            loading = true;
            error = null;

            const response = await api.patch(`/comments/${editingCommentId}`, {
                content: editCommentText.trim()
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            // Actualizar el comentario en la lista
            comments = comments.map(comment => 
                comment.id === editingCommentId ? response.data : comment
            );

            // Limpiar estado de edición
            editingCommentId = null;
            editCommentText = '';

            showSuccess('Comentario actualizado correctamente');
        } catch (err) {
            console.error('Error al actualizar comentario:', err);
            error = 'Error al actualizar el comentario. Por favor, inténtalo de nuevo.';
        } finally {
            loading = false;
        }
    }

    // Eliminar comentario
    async function deleteComment(commentId: number) {
        if (deletingCommentId === commentId) {
            // Confirmar eliminación
            try {
                loading = true;
                error = null;

                await api.delete(`/comments/${commentId}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });

                // Remover comentario de la lista
                comments = comments.filter(comment => comment.id !== commentId);
                deletingCommentId = null;

                showSuccess('Comentario eliminado correctamente');
            } catch (err) {
                console.error('Error al eliminar comentario:', err);
                error = 'Error al eliminar el comentario. Por favor, inténtalo de nuevo.';
                deletingCommentId = null;
            } finally {
                loading = false;
            }
        } else {
            // Solicitar confirmación
            deletingCommentId = commentId;
        }
    }

    // Eliminar archivo adjunto
    async function deleteAttachment(attachmentId: number) {
        if (deletingAttachmentId === attachmentId) {
            // Confirmar eliminación
            try {
                loading = true;
                error = null;

                await api.delete(`/comments/attachments/${attachmentId}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });

                // Remover archivo de la lista
                attachments = attachments.filter(attachment => attachment.id !== attachmentId);
                deletingAttachmentId = null;

                showSuccess('Archivo eliminado correctamente');
            } catch (err) {
                console.error('Error al eliminar archivo:', err);
                error = 'Error al eliminar el archivo. Por favor, inténtalo de nuevo.';
                deletingAttachmentId = null;
            } finally {
                loading = false;
            }
        } else {
            // Solicitar confirmación
            deletingAttachmentId = attachmentId;
        }
    }

    // Verificar si el usuario puede editar/eliminar
    function canEditDelete(itemUserId: number): boolean {
        return userId === itemUserId;
    }

    // Obtener URL de descarga
    function getDownloadUrl(url: string, attachment: Attachment): string {
        if (!url) return '';
        
        if (url.includes('cloudinary.com/') && url.includes('/raw/upload/')) {
            return url;
        }
        
        if (url.includes('cloudinary.com/')) {
            const separator = url.includes('?') ? '&' : '?';
            return `${url}${separator}fl_attachment=true&attachment=${encodeURIComponent(attachment.originalName)}`;
        }
        
        return url;
    }

    // Ver archivo
    function handleFileView(attachment: Attachment) {
        if (
            attachment.mimeType.includes('pdf') ||
            attachment.mimeType.includes('word') ||
            attachment.mimeType.includes('excel') ||
            attachment.mimeType.includes('powerpoint') ||
            attachment.mimeType.includes('msword') ||
            attachment.mimeType.includes('officedocument')
        ) {
            handleDownloadFile(attachment);
        } else {
            window.open(attachment.path, '_blank');
        }
    }

    // Descargar archivo
    async function handleDownloadFile(attachment: Attachment) {
        const isPdfOrDocument = 
            attachment.mimeType.includes('pdf') ||
            attachment.mimeType.includes('word') ||
            attachment.mimeType.includes('excel') ||
            attachment.mimeType.includes('powerpoint') ||
            attachment.mimeType.includes('msword') ||
            attachment.mimeType.includes('officedocument');
        
        if (isPdfOrDocument) {
            downloadLoading = true;
            
            try {
                const response = await fetch(attachment.path);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = attachment.originalName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } catch (error) {
                console.error('Error al descargar el archivo:', error);
                error = 'Error al descargar el archivo. Intente de nuevo.';
            } finally {
                downloadLoading = false;
            }
        } else {
            const downloadUrl = getDownloadUrl(attachment.path, attachment);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = attachment.originalName;
            a.target = "_blank";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    }

    // Formatear fecha y hora
    function formatDateTime(dateString: string): string {
        if (!dateString) return '-';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleString('es-ES', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return dateString;
        }
    }

    // Formatear tamaño de archivo
    function formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Obtener nombre de usuario
    function getUserName(user: any): string {
        if (!user) return 'Usuario desconocido';
        
        if (user.firstName && user.lastName) {
            return `${user.firstName} ${user.lastName}`;
        }
        
        if (user.username) {
            return user.username;
        }
        
        return `Usuario #${user.id}`;
    }

    // Obtener iniciales del usuario
    function getUserInitials(user: any): string {
        if (!user) return '?';
        
        if (user.firstName && user.lastName) {
            return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
        }
        
        if (user.username) {
            return user.username.charAt(0).toUpperCase();
        }
        
        return '?';
    }

    // Obtener color de avatar
    function getUserAvatarColor(userId: number): string {
        const colors = [
            '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', 
            '#1abc9c', '#d35400', '#c0392b', '#16a085', '#8e44ad'
        ];
        
        return colors[userId % colors.length];
    }

    // Obtener icono de archivo
    function getFileIcon(mimeType: string): string {
        if (mimeType.startsWith('image/')) return '🖼️';
        if (mimeType.startsWith('audio/')) return '🎵';
        if (mimeType.startsWith('video/')) return '🎬';
        if (mimeType.includes('pdf')) return '📄';
        if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
        if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
        if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📊';
        if (mimeType.includes('compressed') || mimeType.includes('zip')) return '🗜️';
        return '📎';
    }

    // Cerrar modal
    function closeModal() {
        isOpen = false;
        comments = [];
        attachments = [];
        task = null;
        newComment = '';
        selectedFile = null;
        error = null;
        showSuccessMessage = false;
        editingCommentId = null;
        editCommentText = '';
        deletingCommentId = null;
        deletingAttachmentId = null;
        onClose();
    }

    // Reactive statements
    $: if (isOpen && taskId) {
        loadTaskData();
    }

    $: if (!isOpen) {
        comments = [];
        attachments = [];
        task = null;
        newComment = '';
        selectedFile = null;
        error = null;
        showSuccessMessage = false;
        editingCommentId = null;
        editCommentText = '';
        deletingCommentId = null;
        deletingAttachmentId = null;
    }
</script>

{#if isOpen}
    <div class="modal-backdrop" on:click={closeModal}>
        <div class="modal-content" on:click|stopPropagation>
            <div class="modal-header">
                <h2>
                    <span class="icon">💬</span>
                    Comentarios y Archivos - {task?.title || taskTitle}
                </h2>
                <button class="close-btn" on:click={closeModal}>×</button>
            </div>

            <div class="modal-body">
                {#if showSuccessMessage}
                    <div class="success-alert">
                        {successMessage}
                    </div>
                {/if}

                <!-- Pestañas -->
                <div class="tabs">
                    <button 
                        class="tab-btn" 
                        class:active={activeTab === 'all'}
                        on:click={() => activeTab = 'all'}
                    >
                        Todos
                    </button>
                    <button 
                        class="tab-btn" 
                        class:active={activeTab === 'comments'}
                        on:click={() => activeTab = 'comments'}
                    >
                        Comentarios
                    </button>
                    <button 
                        class="tab-btn" 
                        class:active={activeTab === 'attachments'}
                        on:click={() => activeTab = 'attachments'}
                    >
                        Archivos
                    </button>
                </div>

                <!-- Contenido de las pestañas -->
                <div class="tab-content">
                    {#if loading && !comments.length && !attachments.length}
                        <div class="loading-container">
                            <div class="spinner"></div>
                            <p>Cargando datos...</p>
                        </div>
                    {:else if error}
                        <div class="error-alert">
                            <h4>Error</h4>
                            <p>{error}</p>
                            <button class="btn btn-sm" on:click={loadTaskData}>
                                Reintentar
                            </button>
                        </div>
                    {:else}
                        <!-- Mostrar comentarios -->
                        {#if activeTab === 'comments' || activeTab === 'all'}
                            <div class="section">
                                {#if activeTab === 'all'}
                                    <h4 class="section-title">Comentarios</h4>
                                {/if}
                                
                                {#if !loading && comments.length === 0}
                                    <div class="empty-state">
                                        <p>No hay comentarios para esta tarea.</p>
                                    </div>
                                {:else}
                                    <div class="comments-list">
                                        {#each comments as comment}
                                            <div class="comment-card">
                                                <div class="comment-header">
                                                    <div 
                                                        class="user-avatar"
                                                        style="background-color: {getUserAvatarColor(comment.user.id)}"
                                                    >
                                                        {getUserInitials(comment.user)}
                                                    </div>
                                                    <div class="comment-meta">
                                                        <h6>{getUserName(comment.user)}</h6>
                                                        <small>{formatDateTime(comment.createdAt)}</small>
                                                    </div>
                                                    {#if canEditDelete(comment.user_id)}
                                                        <div class="comment-actions">
                                                            {#if editingCommentId === comment.id}
                                                                <button 
                                                                    class="action-btn save-btn"
                                                                    on:click={saveEditComment}
                                                                    disabled={loading || !editCommentText.trim()}
                                                                    title="Guardar"
                                                                >
                                                                    ✓
                                                                </button>
                                                                <button 
                                                                    class="action-btn cancel-btn"
                                                                    on:click={cancelEditComment}
                                                                    disabled={loading}
                                                                    title="Cancelar"
                                                                >
                                                                    ✕
                                                                </button>
                                                            {:else}
                                                                <button 
                                                                    class="action-btn edit-btn"
                                                                    on:click={() => startEditComment(comment)}
                                                                    disabled={loading}
                                                                    title="Editar"
                                                                >
                                                                    ✏️
                                                                </button>
                                                                <button 
                                                                    class="action-btn delete-btn"
                                                                    class:confirm={deletingCommentId === comment.id}
                                                                    on:click={() => deleteComment(comment.id)}
                                                                    disabled={loading}
                                                                    title={deletingCommentId === comment.id ? 'Confirmar eliminación' : 'Eliminar'}
                                                                >
                                                                    {deletingCommentId === comment.id ? '⚠️' : '🗑️'}
                                                                </button>
                                                            {/if}
                                                        </div>
                                                    {/if}
                                                </div>
                                                <div class="comment-content">
                                                    {#if editingCommentId === comment.id}
                                                        <textarea
                                                            bind:value={editCommentText}
                                                            class="edit-comment-textarea"
                                                            rows="3"
                                                            disabled={loading}
                                                        ></textarea>
                                                    {:else}
                                                        <p>{comment.content}</p>
                                                    {/if}
                                                </div>
                                            </div>
                                        {/each}
                                    </div>
                                {/if}
                                
                                <!-- Formulario para nuevo comentario -->
                                <form on:submit={handleSubmitComment} class="comment-form">
                                    <textarea
                                        bind:value={newComment}
                                        placeholder="Escribe un comentario..."
                                        rows="3"
                                        disabled={loading}
                                        class="comment-textarea"
                                    ></textarea>
                                    <div class="form-actions">
                                        <button 
                                            type="submit" 
                                            class="btn btn-primary"
                                            disabled={!newComment.trim() || loading}
                                        >
                                            {#if loading}
                                                <span class="loading-spinner"></span>
                                                Enviando...
                                            {:else}
                                                Enviar comentario
                                            {/if}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        {/if}

                        <!-- Mostrar archivos adjuntos -->
                        {#if activeTab === 'attachments' || activeTab === 'all'}
                            <div class="section">
                                {#if activeTab === 'all'}
                                    <h4 class="section-title">Archivos Adjuntos</h4>
                                {/if}
                                
                                {#if !loading && attachments.length === 0}
                                    <div class="empty-state">
                                        <p>No hay archivos adjuntos para esta tarea.</p>
                                    </div>
                                {:else}
                                    <div class="attachments-list">
                                        {#each attachments as attachment}
                                            <div class="attachment-card">
                                                <div class="attachment-header">
                                                    <div class="file-icon">
                                                        {getFileIcon(attachment.mimeType)}
                                                    </div>
                                                    <div class="attachment-info">
                                                        <h6>{attachment.originalName}</h6>
                                                        <div class="attachment-meta">
                                                            <span class="file-size">{formatFileSize(attachment.size)}</span>
                                                            <span class="file-date">
                                                                Subido por {getUserName(attachment.user)} - {formatDateTime(attachment.createdAt)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="attachment-actions">
                                                    {#if attachment.mimeType.includes('pdf') || 
                                                        attachment.mimeType.includes('word') || 
                                                        attachment.mimeType.includes('excel') || 
                                                        attachment.mimeType.includes('msword') || 
                                                        attachment.mimeType.includes('officedocument')}
                                                        <button 
                                                            class="btn btn-sm btn-outline"
                                                            on:click={() => handleDownloadFile(attachment)}
                                                            disabled={downloadLoading}
                                                        >
                                                            {downloadLoading ? 'Procesando...' : 'Ver / Descargar'}
                                                        </button>
                                                    {:else}
                                                        <button 
                                                            class="btn btn-sm btn-outline"
                                                            on:click={() => window.open(attachment.path, '_blank')}
                                                        >
                                                            Ver
                                                        </button>
                                                        <button 
                                                            class="btn btn-sm btn-primary"
                                                            on:click={() => handleDownloadFile(attachment)}
                                                            disabled={downloadLoading}
                                                        >
                                                            Descargar
                                                        </button>
                                                    {/if}
                                                    {#if canEditDelete(attachment.user_id)}
                                                        <button 
                                                            class="btn btn-sm btn-danger"
                                                            class:confirm={deletingAttachmentId === attachment.id}
                                                            on:click={() => deleteAttachment(attachment.id)}
                                                            disabled={loading}
                                                        >
                                                            {#if deletingAttachmentId === attachment.id}
                                                                ⚠️ Confirmar
                                                            {:else}
                                                                🗑️ Eliminar
                                                            {/if}
                                                        </button>
                                                    {/if}
                                                </div>
                                            </div>
                                        {/each}
                                    </div>
                                {/if}
                                
                                <!-- Formulario para subir archivo -->
                                <form on:submit={handleUploadFile} class="upload-form">
                                    <input
                                        type="file"
                                        id="fileInput"
                                        on:change={handleFileChange}
                                        disabled={loading}
                                        class="file-input"
                                    />
                                    {#if uploadProgress > 0 && uploadProgress < 100}
                                        <div class="progress-bar">
                                            <div 
                                                class="progress-fill" 
                                                style="width: {uploadProgress}%"
                                            ></div>
                                            <span class="progress-text">{uploadProgress}%</span>
                                        </div>
                                    {/if}
                                    <div class="form-actions">
                                        <button 
                                            type="submit" 
                                            class="btn btn-primary"
                                            disabled={!selectedFile || loading}
                                        >
                                            {#if loading}
                                                <span class="loading-spinner"></span>
                                                Subiendo...
                                            {:else}
                                                Subir archivo
                                            {/if}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        {/if}
                    {/if}
                </div>
            </div>

            <div class="modal-footer">
                <button class="btn btn-secondary" on:click={closeModal}>
                    Cerrar
                </button>
            </div>
        </div>
    </div>
{/if}