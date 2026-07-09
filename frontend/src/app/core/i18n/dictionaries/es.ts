import { TranslationDictionary } from "../i18n.model";

export const ES_TRANSLATIONS: TranslationDictionary = {
  "app.name": "ConfCall Scheduler",
  "booking_links.empty_hint":
    "Crea un enlace público en la página de reserva después de elegir grupo, participantes y horario disponible.",
  "booking_links.list_title": "Enlaces públicos creados",
  "route.login.title": "Iniciar sesión",
  "route.verify_email.title": "Verificar email",
  "route.reset_password.title": "Restablecer contraseña",
  "route.dashboard.title": "Inicio",
  "route.home.title": "Acerca de la aplicación",
  "route.availability.title": "Calendario de disponibilidad",
  "route.book.title": "Encontrar hora para la reunión",
  "route.booking_links.title": "Enlaces de reserva",
  "route.groups.title": "Grupos",
  "route.profile.title": "Perfil",
  "route.public_booking.title": "Reservar reunión",
  "route.public_booking_cancel.title": "Cancelar reunión",
  "route.meetings.title": "Reuniones",
  "nav.dashboard": "Inicio",
  "nav.availability": "Disponibilidad",
  "nav.groups": "Grupos",
  "nav.book": "Reservar",
  "nav.booking_links": "Enlaces",
  "nav.meetings": "Reuniones",
  "nav.settings": "Ajustes",
  "nav.profile": "Perfil",
  "nav.account_menu": "Menú de cuenta",
  "nav.primary": "Navegación principal",
  "nav.new_meetings_count": "Reuniones nuevas: {count}",
  "nav.sign_out": "Salir",
  "nav.sign_in": "Entrar",
  "home.hero.badge": "ConfCall Scheduler",
  "home.hero.title": "Planifica reuniones sin idas y vueltas",
  "home.hero.subtitle":
    "Crea un grupo, marca la disponibilidad y encuentra la hora común. La app crea la reunión y el enlace de vídeo automáticamente.",
  "home.hero.register": "Entrar por invitación",
  "home.hero.sign_in": "Entrar",
  "home.hero.open_app": "Abrir la app",
  "home.steps.badge": "Cómo funciona",
  "home.steps.title": "Un recorrido claro del grupo a la reunión",
  "home.steps.subtitle":
    "El flujo se reduce a tres pasos para entender el producto antes de entrar.",
  "home.step.groups.title": "Crear un grupo",
  "home.step.groups.description":
    "Añade miembros por email y envíales un enlace de invitación.",
  "home.step.availability.title": "Marcar disponibilidad",
  "home.step.availability.description":
    "Rellena el calendario con slots libres, reglas recurrentes y excepciones por fecha.",
  "home.step.booking.title": "Obtener la hora y el enlace",
  "home.step.booking.description":
    "La app encuentra el solapamiento, crea la reunión y prepara el enlace.",
  "home.feature.groups.title": "Grupos e invitaciones",
  "home.feature.groups.description":
    "Crea grupos, añade miembros por email y envíales enlaces de invitación de un solo uso para registrarse.",
  "home.feature.availability.title": "Calendario de disponibilidad",
  "home.feature.availability.description":
    "Marca slots libres, reglas recurrentes y excepciones por fecha en un mismo calendario.",
  "home.feature.booking.title": "Búsqueda y reuniones",
  "home.feature.booking.description":
    "Encuentra la hora común para todos y crea una videorreunión en un paso.",
  "home.visual.availability": "Disponibilidad",
  "home.visual.booking": "Reserva",
  "home.visual.booking_description": "45 minutos",
  "home.visual.booking_name": "Slot común encontrado",
  "home.visual.calendar_month": "Junio 2026",
  "home.visual.groups": "Grupos",
  "home.visual.groups_count": "12 miembros",
  "home.visual.groups_name": "Comité de la conferencia",
  "home.visual.intersection": "Intersección",
  "home.visual.intersection_description":
    "Todos los miembros seleccionados están libres",
  "home.visual.intersection_time": "Mar, 14:00 - 14:45",
  "home.visual.next_step": "Siguiente paso",
  "home.visual.next_step_description":
    "El enlace estará listo al reservar la reunión",
  "home.visual.next_step_name": "Crear una videorreunión",
  "home.visual.rules_description": "Reglas recurrentes y excepciones por fecha",
  "home.visual.rules_name": "Slots semanales",
  "profile.title": "Perfil",
  "profile.display_name": "Nombre visible",
  "profile.photo_url": "URL de la foto",
  "profile.language": "Idioma de la aplicación",
  "profile.save": "Guardar perfil",
  "profile.saving": "Guardando...",
  "profile.name_placeholder": "Tu nombre",
  "profile.avatar_placeholder": "https://example.com/avatar.jpg",
  "profile.description":
    "Tu nombre, foto e idioma de la interfaz se guardan en tu perfil.",
  "profile.preview_description":
    "Así verán otros participantes tu nombre, avatar e idioma.",
  "profile.preview_photo_empty": "Sin foto",
  "profile.preview_photo_set": "Foto subida",
  "profile.preview_title": "Vista previa del perfil",
  "profile.save_hint": "Los cambios se aplican después de guardar.",
  "profile.updated_title": "Perfil actualizado",
  "profile.updated_message": "Los ajustes del perfil se han guardado.",
  "profile.save_error_title": "No se pudo guardar el perfil",
  "common.check_data_retry": "Revisa los datos e inténtalo de nuevo.",
  "common.forbidden": "Acceso denegado",
  "auth.account_create_failed": "No se pudo crear la cuenta",
  "auth.email_exists":
    "Ya existe un usuario con este email. Inicia sesión y abre la invitación de nuevo.",
  "auth.invalid_credentials": "Email o contraseña incorrectos",
  "auth.invite_invalid": "La invitación no es válida o se envió a otro email.",
  "auth.reset_link_invalid":
    "El enlace para restablecer la contraseña no es válido o ha caducado.",
  "auth.smtp_not_configured":
    "El correo no está configurado: añade SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS y MAIL_FROM.",
  "auth.token_invalid": "Token de autenticación no válido",
  "auth.verify_link_invalid":
    "El enlace de verificación no es válido o ha caducado.",
  "availability.intersection.choose_participants":
    "Selecciona al menos un participante",
  "availability.intersection.invalid_date":
    "Selecciona una fecha de reunión válida",
  "availability.intersection.no_availability":
    "No todos los usuarios tienen disponibilidad en este día",
  "availability.intersection.no_availability_all":
    "Ninguno de los usuarios elegidos tiene huecos libres en este día",
  "availability.intersection.no_availability_single":
    "{name} no tiene huecos libres en este día",
  "availability.intersection.no_availability_some":
    "Algunos de los usuarios elegidos no tienen huecos libres en este día",
  "availability.intersection.range_too_long":
    "Selecciona un rango de no más de 31 días",
  "booking.conflict":
    "Esta hora ya está ocupada por otra reunión. Actualiza las opciones y elige un hueco libre.",
  "booking.link_inactive":
    "Este enlace de reserva está inactivo ahora. Si el organizador lo vuelve a activar, repite la comprobación.",
  "booking.link_not_found": "No se encontró el enlace de reserva",
  "group.email_mismatch":
    "La invitación solo se puede aceptar con el email indicado.",
  "group.emails_required": "Introduce al menos un email",
  "group.invitation_invalid": "El enlace de invitación no es válido",
  "group.invitation_not_found": "No se encontró la invitación",
  "group.invitation_already_handled": "La invitación ya fue gestionada",
  "group.invitation_resend_failed": "No se pudo reenviar la invitación",
  "group.member_only": "Solo los miembros del grupo pueden acceder",
  "group.name_required": "Introduce un nombre de grupo",
  "group.not_found": "No se encontró el grupo",
  "group.owner_cannot_be_removed":
    "No se puede eliminar al propietario del grupo",
  "group.owner_only": "Solo el propietario del grupo puede gestionar miembros",
  "group.user_not_found": "No se encontró el usuario",
  "meeting.forbidden": "Acceso denegado",
  "meeting.group_member_mismatch":
    "Selecciona participantes del grupo. Uno de los emails no se encontró entre los usuarios registrados.",
  "meeting.time_conflict":
    "La hora seleccionada ya está ocupada por otra reunión. Actualiza las opciones y elige un hueco libre.",
  "video.telemost.forbidden":
    "El token de Telemost no tiene permiso para crear conferencias.",
  "video.telemost.invalid_request":
    "Telemost rechazó los parámetros de creación de la conferencia.",
  "video.telemost.invalid_token":
    "Telemost no aceptó el token de autorización. Revisa el scope y el tipo de token.",
  "video.telemost.not_configured":
    "Telemost no está configurado: añade TELEMOST_OAUTH_TOKEN al .env.",
  "video.telemost.unavailable":
    "Telemost no está disponible temporalmente. Inténtalo de nuevo más tarde.",
  "groups.title": "Grupos y acceso de miembros",
  "groups.name_placeholder": "Nombre del grupo",
  "groups.create": "Crear grupo",
  "groups.creating": "Creando...",
  "groups.loading": "Cargando grupos",
  "groups.loading_description": "Comprobando los grupos a los que perteneces.",
  "groups.load_error": "No se pudieron cargar los grupos",
  "groups.empty_title": "Todavía no tienes grupos",
  "groups.empty_description":
    "Crea tu primer grupo para gestionar miembros y reuniones.",
  "groups.registered_user_email": "Email de usuario registrado",
  "common.retry": "Reintentar",
  "common.copy": "Copiar",
  "common.close": "Cerrar",
  "common.close_notification": "Cerrar notificación",
  "a11y.skip_to_content": "Saltar al contenido principal",
  "a11y.select_group": "Seleccionar grupo",
  "a11y.select_participant": "Seleccionar participante",
  "a11y.selected_group": "Grupo seleccionado",
  "a11y.selected_participant": "Participante seleccionado",
  "common.open": "Abrir",
  "common.edit": "Editar",
  "common.active": "Activo",
  "common.used": "Usado",
  "common.owner": "Propietario",
  "common.member": "Miembro",
  "common.add": "Añadir",
  "common.adding": "Añadiendo...",
  "settings.booking_links": "Enlaces de reserva",
  "settings.new_link": "Nuevo enlace",
  "settings.link_title": "Título del enlace",
  "settings.optional_description": "Descripción (opcional)",
  "settings.meeting_duration": "Duración de la reunión",
  "settings.create_link": "Crear enlace",
  "settings.creating": "Creando...",
  "settings.no_public_links": "Todavía no hay enlaces públicos",
  "common.soon": "Pronto",
  "common.disable": "Desactivar",
  "common.disabled": "Desactivado",
  "common.enable": "Activar",
  "common.delete": "Eliminar",
  "book.title": "Encontrar hora para la reunión",
  "book.group_and_participants": "Grupo y participantes",
  "book.steps": "Pasos de reserva",
  "book.available_date_legend": "El amarillo marca fechas con tiempo libre",
  "book.available_date_tooltip":
    "Para un participante son fechas con sus huecos libres. Para varios participantes son fechas con coincidencias comunes.",
  "book.book_slot": "Crear reunión",
  "book.book_slot_tooltip": "Crear una reunión en este intervalo libre",
  "book.clear_selection": "Quitar selección",
  "book.group": "Grupo",
  "book.find_group": "Buscar grupo",
  "book.date": "Fecha",
  "book.date_mode": "Modo de fecha",
  "book.date_mode_range": "Rango",
  "book.date_mode_single": "Fecha única",
  "book.date_range_hint":
    "Cambia al modo de rango para buscar varios días y definir inicio y fin por separado.",
  "book.date_single_hint":
    "Elige una sola fecha si solo necesitas comprobar un día.",
  "book.single_participant_by_day": "Disponibilidad por día",
  "book.single_participant_by_day_description":
    "Cada día muestra los intervalos libres del participante elegido.",
  "book.single_participant_ranges": "Intervalos libres del participante",
  "book.single_participant_ranges_description":
    "Se muestran los intervalos libres del participante elegido sin depender de la duración de la reunión.",
  "book.single_participant_slots": "Huecos libres del participante",
  "book.single_participant_hint":
    "Puedes ver la disponibilidad de {name} con los mismos colores que en el calendario de disponibilidad.",
  "book.single_participant_title": "Disponibilidad del participante",
  "book.time_matches": "Coincidencias de tiempo",
  "book.time_matches_by_day": "Coincidencias de tiempo por día",
  "book.time_matches_by_day_description":
    "Cada día muestra los intervalos que encajan y los huecos libres.",
  "book.time_matches_description":
    "Se muestran intervalos compartidos por los participantes elegidos sin depender de la duración de la reunión.",
  "book.show_options": "Mostrar opciones",
  "book.searching": "Buscando...",
  "book.duration": "Duración",
  "book.duration_any": "Cualquiera",
  "book.no_suitable_slots": "No hay horarios adecuados",
  "book.intersection_date": "Fecha del cruce",
  "book.shared_free_ranges": "Intervalos libres comunes",
  "meetings.title": "Mis reuniones",
  "meetings.no_new": "No hay reuniones nuevas",
  "meetings.no_scheduled": "No hay reuniones programadas",
  "availability.title": "Configurar disponibilidad",
  "availability.free": "Libre",
  "availability.busy": "Ocupado",
  "common.today": "Hoy",
  "common.month": "Mes",
  "common.year": "Año",
  "common.save": "Guardar",
  "common.unsaved_changes": "Hay cambios sin guardar",
  "common.ok": "Entendido",
  "common.confirm": "Confirmar",
  "common.cancel": "Cancelar",
  "common.item.one": "elemento",
  "common.item.few": "elementos",
  "common.item.many": "elementos",
  "common.day.one": "día",
  "common.day.few": "días",
  "common.day.many": "días",
  "weekday.mon.short": "Lun",
  "weekday.tue.short": "Mar",
  "weekday.wed.short": "Mié",
  "weekday.thu.short": "Jue",
  "weekday.fri.short": "Vie",
  "weekday.sat.short": "Sáb",
  "weekday.sun.short": "Dom",
  "weekday.mon": "Lunes",
  "weekday.tue": "Martes",
  "weekday.wed": "Miércoles",
  "weekday.thu": "Jueves",
  "weekday.fri": "Viernes",
  "weekday.sat": "Sábado",
  "weekday.sun": "Domingo",
  "availability.page_title": "Calendario de disponibilidad",
  "availability.page_subtitle":
    "Selecciona un día para ver su horario. Añade slots con el botón de más en la celda.",
  "availability.previous_month": "Mes anterior",
  "availability.next_month": "Mes siguiente",
  "availability.legend": "Tipos de slots",
  "availability.free_tooltip":
    "El tiempo libre puede ser puntual o recurrente. Se usa para buscar horarios de reunión.",
  "availability.free_slot": "Slot libre",
  "availability.busy_tooltip":
    "Hay una reunión reservada para este horario. Selecciona el día para ver detalles.",
  "availability.busy_slot": "Ocupado por reunión",
  "availability.unsaved_badge": "Cambios sin guardar",
  "availability.month_calendar": "Calendario mensual",
  "availability.day_has_meeting_tooltip":
    "Este día tiene una reunión reservada. Selecciona el día para ver detalles.",
  "availability.day_has_meeting": "Este día tiene una reunión",
  "availability.delete_slot_message":
    "El slot se eliminará del calendario de disponibilidad inmediatamente y ya no estará disponible para reservas.",
  "availability.delete_slot_title": "¿Eliminar slot?",
  "availability.add_slot_on": "Añadir slot el",
  "availability.add_slot_tooltip":
    "Añadir o ajustar un slot de disponibilidad el",
  "availability.add_free_slot_tooltip": "Añadir un nuevo slot libre el",
  "availability.open_day_schedule": "Abrir horario de",
  "availability.add_slot": "Añadir slot",
  "availability.more_items_prefix": "Más",
  "availability.more_items_tooltip":
    "Selecciona el día para abrir la lista completa.",
  "availability.day_schedule": "Horario del día",
  "availability.rule": "Regla",
  "availability.day_empty_title": "No hay slots este día",
  "availability.day_empty_message":
    "Añade un slot libre para que se pueda reservar.",
  "availability.footer.dirty": "Cambios",
  "availability.footer.saved": "Guardado",
  "availability.footer.current": "Actualizado",
  "availability.footer.dirty_tooltip":
    "Hay cambios sin guardar. Guarda el calendario para que los nuevos slots se usen en las reservas.",
  "availability.footer.current_tooltip":
    "El calendario de disponibilidad está sincronizado con los datos guardados.",
  "availability.footer.saving": "Guardando...",
  "availability.footer.saving_tooltip": "Guardando cambios del calendario.",
  "availability.footer.save_tooltip":
    "Guardar cambios para usarlos al buscar horarios de reunión.",
  "availability.footer.no_changes_tooltip": "No hay cambios sin guardar.",
  "availability.toast.saved_title": "Disponibilidad guardada",
  "availability.toast.saved_message":
    "El calendario se actualizó y las reglas de slots se aplicaron.",
  "availability.toast.save_error_title": "No se pudo guardar la disponibilidad",
  "availability.toast.save_error_message":
    "Revisa los intervalos e intenta guardar de nuevo.",
  "availability.conflict.title": "El slot se solapa con otro",
  "availability.conflict.single_message":
    "Este horario se solapa parcialmente con otro slot puntual. ¿Unirlos en un solo rango?",
  "availability.conflict.recurring_message":
    "Este horario se solapa parcialmente con un slot recurrente. ¿Unir las reglas en un solo rango?",
  "availability.conflict.mixed_title":
    "El slot se solapa con una regla recurrente",
  "availability.conflict.mixed_message":
    "Puedes unir la disponibilidad solo para la fecha seleccionada o actualizar el slot recurrente para todas las repeticiones.",
  "availability.conflict.merge": "Unir",
  "availability.conflict.merge_date": "Unir solo en esta fecha",
  "availability.conflict.update_recurring": "Actualizar slot recurrente",
  "availability.conflict.cancel_create": "No crear",
  "availability.weekly_slot_tooltip": "Slot libre de una regla recurrente",
  "availability.date_slot_tooltip": "Slot para una fecha",
  "availability.every": "Cada",
  "availability.every_day": "cada día",
  "availability.meeting_tooltip_prefix": "Reunión",
  "availability.meeting": "Reunión",
  "meetings.status": "Estado",
  "meetings.status.scheduled": "Programada",
  "meetings.status.completed": "Completada",
  "meetings.status.cancelled": "Cancelada",
  "meetings.participants": "Participantes",
  "meetings.open_video": "Abrir videollamada",
  "availability.dialog.date": "Fecha",
  "availability.dialog.day": "Día del calendario",
  "availability.dialog.decrease_repeat": "Disminuir intervalo de repetición",
  "availability.dialog.edit_slot": "Editar slot",
  "availability.dialog.end": "Fin",
  "availability.dialog.end_time": "Fin del slot",
  "availability.dialog.end_tooltip":
    "Después de esta hora el slot ya no estará disponible para reservas.",
  "availability.dialog.from_date": "Desde",
  "availability.dialog.from_date_tooltip":
    "Primer día desde el que se aplicará el slot recurrente.",
  "availability.dialog.hint":
    "Un slot puntual se crea solo para el día seleccionado. Un slot recurrente se aplica al rango de fechas.",
  "availability.dialog.increase_repeat": "Aumentar intervalo de repetición",
  "availability.dialog.invalid_date":
    "La fecha de inicio no puede ser posterior a la fecha de fin.",
  "availability.dialog.invalid_time":
    "La hora de inicio debe ser anterior a la hora de fin.",
  "availability.dialog.period_end": "Fin del periodo",
  "availability.dialog.period_start": "Inicio del periodo",
  "availability.dialog.recurring": "Repetir",
  "availability.dialog.recurring_tooltip":
    "Crea una serie de slots libres dentro del rango de fechas seleccionado.",
  "availability.dialog.repeat_every": "Repetir cada",
  "availability.dialog.repeat_every_tooltip":
    "Por ejemplo, 7 significa semanal, 14 significa cada dos semanas.",
  "availability.dialog.repeat_interval": "Intervalo de repetición en días",
  "availability.dialog.save_slot": "Guardar slot",
  "availability.dialog.save_tooltip":
    "Guardar el slot para usarlo al buscar horarios de reunión.",
  "availability.dialog.section_scope": "Cuándo se aplica",
  "availability.dialog.section_time": "Horario del slot",
  "availability.dialog.single": "Puntual",
  "availability.dialog.single_date_tooltip":
    "El slot aparecerá solo en este día del calendario.",
  "availability.dialog.single_tooltip":
    "Útil para excepciones y periodos libres puntuales.",
  "availability.dialog.slot": "Slot de disponibilidad",
  "availability.dialog.slot_type": "Tipo de slot",
  "availability.dialog.start": "Inicio",
  "availability.dialog.start_time": "Inicio del slot",
  "availability.dialog.start_tooltip":
    "Desde esta hora el slot estará disponible para reservas.",
  "availability.dialog.to_date": "Hasta",
  "availability.dialog.to_date_tooltip":
    "Último día en que se creará el slot recurrente.",
  "login.subtitle": "Reserva de reuniones y videollamadas para comités",
  "login.title": "Entrar y registrarse",
  "login.email": "Email",
  "login.email_placeholder": "your@email.com",
  "login.forgot_password": "¿Olvidaste la contraseña?",
  "login.login_error": "No se pudo entrar con email y contraseña",
  "login.name": "Nombre",
  "login.name_placeholder": "Cómo debemos llamarte",
  "login.new_password": "Nueva contraseña",
  "login.new_password_placeholder": "Introduce una nueva contraseña",
  "login.password": "Contraseña",
  "login.password_placeholder": "Introduce tu contraseña",
  "login.passwords_mismatch": "Las contraseñas no coinciden",
  "login.register": "Crear cuenta",
  "login.register_help":
    "Introduce tu email, nombre y contraseña. Enviaremos un enlace para confirmar el email.",
  "login.register_tab": "Registro",
  "login.register_title": "Crear una cuenta",
  "login.registering": "Registrando...",
  "login.admin_divider": "o entra como administrador",
  "login.loading": "Entrando...",
  "login.dev_admin": "Entrar como administrador",
  "login.back_home": "← Volver al inicio",
  "login.back_to_login": "← Volver al acceso",
  "login.error": "No se pudo entrar",
  "login.reset_email_required":
    "Introduce el email para restablecer la contraseña",
  "login.reset_error":
    "No se pudo enviar el enlace para restablecer la contraseña",
  "login.reset_form_invalid": "Revisa los campos de contraseña",
  "login.reset_help":
    "Pide un enlace si el correo de confirmación no llegó o necesitas establecer una nueva contraseña.",
  "login.reset_page_help":
    "Abre el enlace del correo y establece una nueva contraseña para la app.",
  "login.reset_sent_message":
    "Hemos enviado un enlace para restablecer la contraseña a {email}.",
  "login.reset_sent_title": "Revisa tu correo",
  "login.reset_success_message":
    "Contraseña actualizada. Ahora puedes entrar con la nueva contraseña.",
  "login.reset_tab": "Restablecer contraseña",
  "login.reset_title": "Restablecer contraseña",
  "login.resetting": "Enviando...",
  "login.register_error": "No se pudo registrar",
  "login.resend_verification": "Enviar correo otra vez",
  "login.verification_resend_error":
    "No se pudo reenviar el correo de confirmación",
  "login.verification_resend_missing":
    "Introduce el email que debe recibir el mensaje",
  "login.sign_in": "Entrar",
  "login.sign_in_help":
    "Entra con el email y la contraseña que definiste después de confirmar la cuenta.",
  "login.sign_in_tab": "Entrar",
  "login.sign_in_title": "Entrar con email y contraseña",
  "login.signing_in": "Entrando...",
  "invite.accept": "Aceptar invitación",
  "invite.accept_error": "No se pudo aceptar la invitación",
  "invite.accepting": "Aceptando...",
  "invite.eyebrow": "Invitación al grupo",
  "invite.email": "Email",
  "invite.group_fallback": "Grupo",
  "invite.group": "Grupo",
  "invite.join": "Unirse al grupo",
  "invite.joining": "Uniéndose...",
  "invite.load_error": "No se pudo abrir la invitación",
  "invite.loading": "Cargando invitación...",
  "invite.accept_hint":
    "Si el email coincide con el tuyo, pulsa Aceptar invitación.",
  "invite.register_error": "No se pudo completar el registro",
  "invite.sign_in_hint":
    "Si ya tienes una cuenta, entra y vuelve a abrir la invitación.",
  "invite.sign_in_link": "¿Ya tienes cuenta? Entrar",
  "invite.summary": "Detalles de la invitación",
  "invite.subtitle":
    "Abre el correo y termina el registro o confirma tu participación.",
  "invite.title": "Únete al grupo",
  "invite.token_missing": "No se encontró el enlace de invitación",
  "login.verification_error": "No se pudo verificar el email",
  "login.verification_failed_message":
    "El enlace de verificación no es válido o ha caducado. Solicita un nuevo correo.",
  "login.verification_failed_title": "La verificación falló",
  "login.verification_loading":
    "Comprobando el enlace y activando la cuenta...",
  "login.verification_sent_message":
    "Hemos enviado un correo a {email}. Abre el enlace para activar la cuenta.",
  "login.verification_sent_title": "Revisa tu correo",
  "login.verification_success_message":
    "Email verificado. La cuenta está activa.",
  "login.verification_success_title": "Email verificado",
  "login.verification_title": "Verificando email",
  "login.verification_token_missing":
    "El enlace de verificación no tiene token",
  "login.reset_token_missing": "El enlace de restablecimiento no tiene token",
  "common.loading": "Cargando...",
  "common.loading_short": "...",
  "common.no_name": "Sin nombre",
  "common.try_again": "Inténtalo de nuevo.",
  "common.user": "Usuario",
  "duration.15": "15 minutos",
  "duration.30": "30 minutos",
  "duration.45": "45 minutos",
  "duration.60": "1 hora",
  "duration.90": "1.5 horas",
  "duration.120": "2 horas",
  "duration.any": "Cualquiera",
  "duration.custom": "{count} minutos",
  "duration.minutes_short": "{count} min",
  "duration.hours_short": "{count} h",
  "duration.hours_minutes_short": "{hours} h {minutes} min",
  "duration.minutes_suffix": "min",
  "dashboard.title": "Resumen de reuniones",
  "dashboard.subtitle":
    "Resumen de reuniones, disponibilidad y reservas públicas.",
  "dashboard.attention": "Requiere atención",
  "dashboard.new_meetings": "reuniones nuevas",
  "dashboard.open_list_hint": "Abre la lista para ver detalles.",
  "dashboard.setup": "Configuración",
  "dashboard.availability_empty": "La disponibilidad está vacía",
  "dashboard.availability_empty_hint":
    "Sin horario, los miembros no podrán encontrar tiempo común.",
  "dashboard.booking": "Reserva",
  "dashboard.no_public_link": "No hay enlace público",
  "dashboard.no_public_link_hint":
    "Crea un enlace para que los invitados elijan hora.",
  "dashboard.next_step": "Siguiente paso",
  "dashboard.next.open_new.title": "Abre reuniones nuevas",
  "dashboard.next.open_new.description": "Hay reuniones que aún no has visto.",
  "dashboard.next.open_new.label": "Abrir reuniones",
  "dashboard.next.availability.title": "Completa la disponibilidad semanal",
  "dashboard.next.availability.description":
    "Sin horario, el sistema no podrá encontrar una hora cómoda.",
  "dashboard.next.availability.label": "Ir al horario",
  "dashboard.next.link.title": "Crea un enlace para invitados",
  "dashboard.next.link.description":
    "Los invitados podrán elegir un hueco sin coordinación manual.",
  "dashboard.next.link.label": "Crear enlace",
  "dashboard.upcoming_meetings": "Próximas reuniones",
  "dashboard.all_meetings": "Todas las reuniones",
  "dashboard.no_scheduled_meetings": "No hay reuniones programadas",
  "dashboard.no_scheduled_meetings_hint":
    "Crea una reunión o envía un enlace público.",
  "dashboard.quick_actions": "Acciones rápidas",
  "dashboard.action.availability.label": "Configurar disponibilidad",
  "dashboard.action.availability.description":
    "Abrir calendario de huecos libres",
  "dashboard.action.book.label": "Buscar hora",
  "dashboard.action.book.description": "Encontrar un hueco común",
  "dashboard.action.groups.label": "Grupos",
  "dashboard.action.groups.description":
    "Gestionar grupos y enlaces de reserva",
  "dashboard.invite_member": "Invitar nuevo miembro",
  "dashboard.invite_member_description": "Enviar una invitación por email",
  "book.subtitle":
    "Elige participantes, fecha y duración. El sistema mostrará solo huecos válidos para todos.",
  "book.step.group.title": "Grupo",
  "book.step.group.description": "Contexto de la reunión",
  "book.step.participants.title": "Participantes",
  "book.step.participants.description": "A quién reunir",
  "book.step.params.title": "Disponibilidad común",
  "book.step.params.description": "Fecha, duración y coincidencias",
  "book.step.outcome.title": "Resultado",
  "book.step.outcome.description": "Reunión o enlace",
  "book.next_step": "Siguiente paso",
  "book.search_parameters": "Parámetros de búsqueda",
  "book.meeting_composition": "composición",
  "book.search_date": "fecha de búsqueda",
  "book.date_from": "Desde",
  "book.date_to": "Hasta",
  "book.group_and_participants_hint":
    "Primero elige un grupo y luego selecciona a las personas que necesites.",
  "book.selected": "seleccionados",
  "book.groups_unavailable": "Los grupos no están disponibles",
  "book.group_tooltip":
    "El grupo limita la lista de participantes y mantiene el contexto correcto.",
  "book.group_search_tooltip": "La búsqueda usa el nombre del grupo",
  "book.show_group_members": "Mostrar miembros del grupo",
  "book.group_not_found": "Grupo no encontrado",
  "book.group_not_found_hint": "Revisa el nombre o crea un grupo en ajustes.",
  "book.participants": "Participantes",
  "book.participants_tooltip":
    "Solo se muestran miembros registrados del grupo seleccionado.",
  "book.participants_picker_hint":
    "Haz clic en las tarjetas de participantes para seleccionar una, varias o todas a la vez.",
  "book.find_participant": "Buscar participante por nombre o email",
  "book.participant_search_tooltip": "Puedes buscar por nombre o email",
  "book.loading_participants": "Cargando participantes",
  "book.loading_participants_hint": "Comprobando miembros del grupo.",
  "book.group_members_unavailable":
    "Los miembros del grupo no están disponibles",
  "book.participant_not_found": "Participante no encontrado",
  "book.participant_not_found_hint": "Revisa el nombre o email.",
  "book.no_group_members": "Este grupo aún no tiene miembros",
  "book.no_group_members_hint":
    "Añade usuarios registrados o envía un código del grupo.",
  "book.loading_groups_hint":
    "Cuando carguen, podrás elegir un grupo para la reunión.",
  "book.no_groups_hint":
    "Crea un grupo en ajustes. Sus miembros aparecerán aquí.",
  "book.selected_parameters": "Resumen de búsqueda",
  "book.open_calendar": "Abrir calendario",
  "book.range_days_found": "Encontrados {count} días con coincidencias",
  "book.range_results": "Coincidencias de tiempo por día",
  "book.range_results_description":
    "Cada día muestra los intervalos que encajan y los huecos libres.",
  "book.show_slots_tooltip":
    "Mostrar huecos libres para el grupo y participantes elegidos",
  "book.outcome_title": "Qué hacer con el horario encontrado",
  "book.outcome_hint":
    "Elige si reservar una reunión interna ahora o crear un enlace para invitados.",
  "book.internal_booking": "Reunión interna",
  "book.internal_booking_hint":
    "Elige uno de los huecos encontrados y crea una reunión para participantes de la aplicación.",
  "book.public_booking_hint":
    "Crea un enlace para que un invitado externo elija una hora libre.",
  "book.public_link_dialog.title": "Crear enlace público",
  "book.public_link_unavailable_message":
    "Primero elige un grupo, participantes y espera a que aparezcan coincidencias.",
  "book.public_link_unavailable_title": "El enlace aún no está disponible",
  "book.searching_slots": "Buscando huecos adecuados",
  "book.searching_slots_hint": "Comprobando horarios y tiempo ocupado.",
  "book.select_all_participants": "Seleccionar todo",
  "book.find_failed": "No se pudo encontrar hora",
  "book.ranges_description":
    "Se muestran intervalos compartidos por los participantes elegidos sin depender de la duración de la reunión.",
  "book.range_tooltip":
    "Dentro de este intervalo puedes elegir una reunión más corta o larga",
  "book.shared_time": "de tiempo común",
  "book.create_meeting": "Crear reunión",
  "book.no_suitable_slots_hint":
    "Prueba otra fecha, reduce la duración o cambia participantes.",
  "book.group_help.empty": "Elige un grupo para ver sus miembros.",
  "book.group_help.selected_prefix": "La reunión se creará en el grupo",
  "book.participants.none": "No hay participantes elegidos",
  "book.participants.count": "{count} participantes",
  "book.suitable_options": "Opciones adecuadas",
  "book.options_found": "{count} opciones encontradas",
  "book.ranges_found": "{count} intervalos comunes",
  "book.disabled.searching": "Espera, la búsqueda ya está en curso",
  "book.disabled.groups_unavailable": "La lista de grupos no está disponible",
  "book.disabled.choose_group": "Elige primero un grupo",
  "book.disabled.members_unavailable":
    "Los miembros del grupo no están disponibles",
  "book.disabled.choose_participants": "Elige participantes",
  "book.date_error.invalid": "Revisa día, mes y año",
  "book.date_error.past": "La fecha no puede ser anterior a hoy",
  "book.date_error.range":
    "La fecha de fin no puede ser anterior a la fecha de inicio",
  "book.date_error.range_too_long":
    "Selecciona un rango de no más de {count} días",
  "book.groups_load_error":
    "No se pudo cargar la lista de grupos. Actualiza la página.",
  "book.group_users_error": "No se pudieron cargar miembros del grupo.",
  "book.toast.groups_unavailable_title": "Grupos no disponibles",
  "book.toast.groups_unavailable_message":
    "Parece un problema de conexión. La lista vacía se muestra aparte.",
  "book.toast.group_changed_title": "Grupo cambiado",
  "book.toast.group_changed_message": "Ahora elige participantes del grupo",
  "book.toast.members_unavailable_title": "Miembros no disponibles",
  "book.toast.members_unavailable_message":
    "Parece un problema de conexión. El grupo vacío se muestra aparte.",
  "book.toast.search_unavailable": "Búsqueda no disponible",
  "book.find_error":
    "No se pudo encontrar hora. Revisa participantes, fecha e inténtalo de nuevo.",
  "book.default_meeting_title": "Reunión del comité de programa",
  "book.toast.meeting_created_title": "Reunión creada",
  "book.toast.meeting_created_message":
    "El enlace de videollamada está listo y disponible en reuniones.",
  "book.create_meeting_error":
    "No se pudo crear la reunión. Inténtalo de nuevo.",
  "book.toast.create_meeting_error_title": "No se pudo crear la reunión",
  "book.dialog.title": "Reservar reunión",
  "book.dialog.meeting_title": "Título",
  "book.dialog.description": "Descripción",
  "book.dialog.create_link_action": "Crear enlace",
  "book.dialog.create_meeting_action": "Crear reunión",
  "book.dialog.meeting_title_full": "Crear reunión",
  "book.dialog.public_link_title": "Crear enlace",
  "book.dialog.title_field": "Título",
  "groups.description":
    "Crea grupos, añade participantes por email y envía invitaciones para que nuevos usuarios se unan al grupo elegido.",
  "groups.name_tooltip":
    "Por ejemplo: Comité de programa 2026. En reservas, los participantes se eligen dentro del grupo.",
  "groups.avatar_placeholder": "https://example.com/group-avatar.png",
  "groups.avatar_tooltip":
    "URL de imagen que se muestra a los invitados en la página pública de reserva",
  "groups.avatar_url": "Avatar del grupo",
  "groups.create_group_subtitle":
    "Indica un nombre claro. Puedes añadir un avatar ahora o más tarde.",
  "groups.create_group_title": "Nuevo grupo",
  "groups.create_tooltip": "Crea el grupo y te asigna como propietario",
  "groups.edit_group": "Editar grupo",
  "groups.edit_tooltip": "Cambiar el nombre y el avatar del grupo",
  "groups.group_details": "Información básica",
  "groups.members": "miembros",
  "groups.members_count": "Miembros: {count}",
  "groups.select_tooltip":
    "Elegir grupo para gestionar miembros e invitaciones",
  "groups.members_available_hint":
    "Los miembros de este grupo están disponibles al reservar una reunión.",
  "groups.member_email_tooltip": "Introduce el email usado durante el registro",
  "groups.add_member_tooltip": "Añade un usuario ya registrado a este grupo",
  "groups.booking_link_create_tooltip":
    "Crea un enlace público de reserva para el grupo seleccionado",
  "groups.booking_link_description_placeholder":
    "Por ejemplo: revisión breve de ponencias",
  "groups.booking_link_email": "Email del invitado",
  "groups.booking_link_email_placeholder": "guest@example.com",
  "groups.booking_link_email_required":
    "Introduce un email de invitado válido.",
  "groups.booking_link_email_tooltip":
    "A esta dirección se enviará un enlace para elegir un horario libre sin registrarse",
  "groups.booking_link_send": "Enviar",
  "groups.booking_link_send_error_message":
    "Comprueba el email y la configuración SMTP, y vuelve a intentarlo.",
  "groups.booking_link_send_error_title": "No se pudo enviar el enlace",
  "groups.booking_link_sent_message": "Enlace enviado a {email}.",
  "groups.booking_link_sent_title": "Enlace enviado",
  "groups.booking_link_title_placeholder":
    "Por ejemplo: llamada con el comité de programa",
  "groups.member_notice_title": "Eres miembro de este grupo",
  "groups.member_notice_message":
    "Solo el propietario del grupo puede añadir participantes por email.",
  "groups.invite_confirm_message": "Se enviarán invitaciones a: {emails}",
  "groups.invite_confirm_title": "¿Enviar invitaciones?",
  "groups.invite_emails": "Emails a invitar",
  "groups.invite_emails_placeholder": "mail1@example.com, mail2@example.com",
  "groups.invite_emails_tooltip":
    "Puedes escribir varios emails separados por comas o espacios",
  "groups.invite_status_accepted": "Aceptada",
  "groups.invite_status_cancelled": "Cancelada",
  "groups.invite_status_expired": "Caducada",
  "groups.invite_status_pending": "Esperando respuesta",
  "groups.loading_invitations": "Cargando invitaciones",
  "groups.loading_invitations_hint":
    "Comprobando qué invitaciones siguen activas.",
  "groups.invitations": "Invitaciones",
  "groups.invitations_hint": "La tabla inferior muestra todos los estados.",
  "groups.no_invitations": "Todavía no hay invitaciones",
  "groups.no_invitations_hint": "Añade emails y envía una invitación.",
  "groups.no_group_links_hint":
    "Aún no se ha creado ningún enlace de reserva para este grupo.",
  "groups.pending_invitation_note":
    "Los correos ya se enviaron mientras la invitación sigue pendiente.",
  "groups.select_group_first_message":
    "Selecciona primero el grupo al que debe pertenecer este enlace.",
  "groups.select_group_first_title": "Elige un grupo",
  "groups.owned_groups": "Mis grupos",
  "groups.member_groups": "Grupos donde eres miembro",
  "groups.remove_member": "Eliminar miembro",
  "groups.remove_member_confirm_message": "¿Eliminar a {name} de este grupo?",
  "groups.remove_member_confirm_title": "¿Eliminar miembro?",
  "groups.remove_member_tooltip": "Quitar a una persona del grupo",
  "groups.pending_invitations_tooltip":
    "Muestra solo las invitaciones que aún no han sido aceptadas.",
  "groups.profile_save_error_title": "No se pudo guardar el grupo",
  "groups.profile_saved_message":
    "El nombre y el avatar del grupo se actualizaron.",
  "groups.profile_saved_title": "Grupo guardado",
  "groups.public_booking": "Reserva pública",
  "groups.public_booking_hint":
    "Crea un enlace del grupo y envíalo a un invitado. Verá la disponibilidad común y reservará una llamada sin registrarse.",
  "groups.resend_invitation": "Enviar otra vez",
  "groups.resending_invitation": "Enviando...",
  "groups.send_invitations": "Enviar invitaciones",
  "groups.send_invitations_tooltip": "Revisa la lista y envía los correos",
  "groups.sending": "Enviando...",
  "settings.booking_links_description":
    "Crea un enlace donde invitados puedan elegir una hora cómoda.",
  "settings.table.actions": "Acciones",
  "settings.table.duration": "Duración",
  "settings.table.email": "Email",
  "settings.table.link": "Enlace",
  "settings.table.member": "Miembro",
  "settings.table.role": "Rol",
  "settings.table.status": "Estado",
  "settings.loading_links": "Cargando enlaces",
  "settings.loading_links_hint":
    "Comprobando enlaces disponibles para invitados.",
  "settings.links_load_error": "No se pudieron cargar enlaces",
  "settings.no_public_links_hint":
    "Crea el primer enlace para que invitados elijan hora.",
  "settings.groups_error":
    "No se pudieron obtener datos de grupos. Inténtalo de nuevo.",
  "settings.invites_load_error":
    "No se pudieron cargar las invitaciones. Inténtalo de nuevo.",
  "settings.link_title_required": "Introduce título del enlace",
  "settings.delete_link.title": "¿Eliminar enlace?",
  "settings.delete_link.message":
    "Tras eliminarlo, los invitados no podrán abrir este enlace.",
  "settings.toast.group_selected_title": "Grupo seleccionado",
  "settings.toast.group_selected_message":
    "Las invitaciones y los miembros pertenecen ahora al grupo seleccionado",
  "settings.toast.no_groups_title": "Aún no hay grupos",
  "settings.toast.no_groups_message":
    "Crea el primer grupo para añadir miembros y enviar invitaciones.",
  "settings.toast.groups_load_error_message":
    "Revisa la conexión con el servidor e inténtalo de nuevo.",
  "settings.toast.group_name_required_title": "Introduce nombre del grupo",
  "settings.toast.group_name_required_message":
    "El nombre ayuda a distinguir comités, equipos o flujos.",
  "settings.toast.group_created_title": "Grupo creado",
  "settings.toast.group_created_message":
    "Ahora puedes añadir miembros y enviar invitaciones.",
  "settings.toast.group_create_error_title": "No se pudo crear el grupo",
  "settings.toast.group_create_error_message":
    "Revisa el nombre e inténtalo de nuevo.",
  "settings.toast.invitation_resend_error_title":
    "No se pudo reenviar la invitación",
  "settings.toast.invitation_resend_error_message":
    "No se pudo enviar el correo otra vez. Inténtalo más tarde.",
  "settings.toast.invitation_resent_title": "Invitación enviada otra vez",
  "settings.toast.invitation_resent_message":
    "El correo se envió de nuevo a la misma dirección.",
  "settings.toast.invites_partial_title": "No se enviaron todos los correos",
  "settings.toast.invites_partial_message":
    "Las invitaciones se crearon, pero algunos correos no llegaron. Revisa las direcciones y envíalos otra vez: {emails}.",
  "settings.toast.invites_sent_title": "Invitaciones enviadas",
  "settings.toast.invites_sent_message": "Los correos se enviaron a la lista.",
  "settings.toast.email_check_title": "Revisa email",
  "settings.toast.email_check_message":
    "Solo puedes añadir un usuario registrado con este email.",
  "settings.toast.member_added_title": "Miembro añadido",
  "settings.toast.member_added_message":
    "Ya puedes elegirlo al reservar reuniones de este grupo.",
  "settings.toast.member_add_error_title": "No se pudo añadir miembro",
  "settings.toast.member_add_error_message":
    "Revisa email e inténtalo de nuevo.",
  "settings.toast.member_removed_title": "Miembro eliminado",
  "settings.toast.member_removed_message":
    "Ya no estará disponible para reservar reuniones en este grupo.",
  "settings.toast.member_remove_error_title": "No se pudo eliminar miembro",
  "settings.toast.member_remove_error_message":
    "Comprueba la acción y vuelve a intentarlo.",
  "settings.toast.link_created_title": "Enlace creado",
  "settings.toast.link_created_message":
    "Los invitados pueden abrirlo y elegir hora.",
  "settings.toast.link_create_error_title": "No se pudo crear enlace",
  "settings.toast.link_copied_title": "Enlace copiado",
  "settings.toast.link_copied_message": "Ya puedes enviarlo a un invitado.",
  "settings.toast.link_enabled_title": "Enlace activado",
  "settings.toast.link_disabled_title": "Enlace desactivado",
  "settings.toast.link_enabled_message":
    "Los invitados ya pueden usar este enlace.",
  "settings.toast.link_disabled_message":
    "Los invitados ya no podrán abrir este enlace.",
  "settings.toast.link_status_error_title": "No se pudo cambiar el estado",
  "settings.toast.connection_retry_message":
    "Inténtalo de nuevo o revisa la conexión.",
  "settings.toast.link_deleted_title": "Enlace eliminado",
  "settings.toast.link_deleted_message":
    "El acceso público de este enlace está cerrado.",
  "settings.toast.link_delete_error_title": "No se pudo eliminar enlace",
  "settings.toast.choose_group_title": "Elige un grupo",
  "settings.toast.choose_group_message":
    "Una invitación siempre se crea para un grupo concreto.",
  "meetings.subtitle":
    "Sigue invitaciones nuevas, llamadas futuras e historial.",
  "meetings.schedule": "Programar",
  "meetings.loading": "Cargando reuniones",
  "meetings.loading_hint": "Comprobando lista y notificaciones.",
  "meetings.load_error": "No se pudieron cargar reuniones",
  "meetings.summary": "Resumen de reuniones",
  "meetings.summary.upcoming": "futuras",
  "meetings.summary.new": "nuevas",
  "meetings.summary.cancelled": "canceladas",
  "meetings.filter": "Filtro de reuniones",
  "meetings.filter.upcoming": "Futuras",
  "meetings.filter.new": "Nuevas",
  "meetings.filter.past": "Pasadas",
  "meetings.filter.cancelled": "Canceladas",
  "meetings.filter.all": "Todas",
  "meetings.new_label": "Reunión nueva",
  "meetings.no_description": "Sin descripción",
  "meetings.participants_count": "participantes",
  "meetings.empty.upcoming": "Aún no hay reuniones futuras",
  "meetings.empty.new": "Aún no hay reuniones nuevas",
  "meetings.empty.past": "Aún no hay reuniones pasadas",
  "meetings.empty.cancelled": "Aún no hay reuniones canceladas",
  "meetings.empty.all": "Aún no hay reuniones",
  "meetings.empty.fallback": "No hay reuniones",
  "meetings.empty.all_hint": "Crea la primera reunión para verla en la lista.",
  "meetings.empty.filtered_hint": "Prueba otro filtro o programa una reunión.",
  "meetings.filter_label.upcoming": "reuniones futuras",
  "meetings.filter_label.new": "reuniones nuevas",
  "meetings.filter_label.past": "reuniones pasadas",
  "meetings.filter_label.cancelled": "reuniones canceladas",
  "meetings.filter_label.all": "reuniones",
  "meetings.cancel.title": "¿Cancelar reunión?",
  "meetings.cancel.message":
    "La reunión seguirá en la lista, pero quedará Cancelada.",
  "meetings.cancel.confirm": "Cancelar reunión",
  "meetings.cancelled_by": "Cancelada por",
  "meetings.decline.action": "Rechazar",
  "meetings.decline.confirm": "Rechazar",
  "meetings.decline.title": "¿Rechazar participación?",
  "meetings.decline.message":
    "Dejarás de ser participante de esta reunión y esta hora volverá a estar disponible para reservar.",
  "meetings.participation.declined": "Has rechazado",
  "meetings.toast.cancelled_title": "Reunión cancelada",
  "meetings.toast.cancelled_message":
    "Los participantes verán el estado actualizado.",
  "meetings.toast.cancel_error_title": "No se pudo cancelar reunión",
  "meetings.toast.cancel_error_message":
    "Inténtalo de nuevo o revisa la conexión.",
  "meetings.toast.decline_error_title": "No se pudo rechazar la participación",
  "meetings.toast.declined_title": "Participación rechazada",
  "meetings.toast.decline_error_message":
    "Inténtalo de nuevo o revisa la conexión.",
  "meetings.toast.declined_message":
    "Esta hora vuelve a estar disponible para reservar.",
  "public_booking.available_date_legend":
    "Las fechas doradas del calendario tienen horarios libres.",
  "public_booking.available_date_tooltip":
    "El dorado marca fechas que ahora tienen horarios disponibles para reservar.",
  "public_booking.booked": "Reunión reservada",
  "public_booking.cancel.already_message":
    "Esta reunión ya fue cancelada. Los participantes la verán entre las reuniones canceladas.",
  "public_booking.cancel.already_title": "La reunión ya está cancelada",
  "public_booking.cancel.error_message":
    "El enlace no es válido o esta reunión ya no se puede cancelar con él.",
  "public_booking.cancel.error_title": "No se pudo cancelar la reunión",
  "public_booking.cancel.loading_message":
    "Comprobando el enlace de cancelación.",
  "public_booking.cancel.loading_title": "Cancelando reunión",
  "public_booking.cancel.success_message":
    "Cancelamos la reunión. Los participantes del grupo verán quién canceló la reserva.",
  "public_booking.cancel.success_title": "Reunión cancelada",
  "public_booking.checking_schedule": "Comprobando horario...",
  "public_booking.choose_slot_hint":
    "Elige un horario libre a la izquierda y confirma la reunión.",
  "public_booking.confirm_meeting": "Confirmar reunión",
  "public_booking.date_panel_hint":
    "Elige una fecha. Los días con horarios libres están resaltados en el calendario.",
  "public_booking.details_hint": "Deja tus datos para la invitación.",
  "public_booking.email_invalid": "Introduce un email válido.",
  "public_booking.email_placeholder": "Email *",
  "public_booking.email_required": "Introduce tu email.",
  "public_booking.email_tooltip":
    "Enviaremos a este email el enlace de videollamada y el enlace para cancelar la reunión.",
  "public_booking.free_options": "Opciones libres",
  "public_booking.link_not_found": "Enlace no encontrado",
  "public_booking.name_placeholder": "Tu nombre *",
  "public_booking.name_required": "Introduce tu nombre.",
  "public_booking.name_tooltip": "Así nos dirigiremos a ti.",
  "public_booking.no_free_time": "No hay tiempo libre en esta fecha",
  "public_booking.options_hint": "Elige una hora adecuada.",
  "public_booking.title_placeholder": "Tema de la reunión *",
  "public_booking.toast.booked_message":
    "El organizador recibió la actualización y el enlace está listo.",
  "public_booking.toast.booked_title": "Reunión reservada",
  "public_booking.toast.error_message":
    "Elige otra hora o inténtalo más tarde.",
  "public_booking.toast.error_title": "No se pudo reservar reunión",
  "public_booking.title_required": "Introduce el tema de la reunión.",
  "public_booking.video_link": "Enlace de videollamada",
  "public_booking.when_to_meet": "Cuándo conviene reunirse",
  "public_booking.your_details": "Tus datos",
};
