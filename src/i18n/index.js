import { useApp } from '../context/AppContext'

// Spanish translations
const es = {
  // Brand / Auth
  'Expense Tracker': 'Rastreador de Gastos',
  'Private spending insights.': 'Perspectivas de gastos privados.',
  'Login': 'Iniciar Sesión',
  'Register': 'Registrarse',
  'Email': 'Correo Electrónico',
  'Password': 'Contraseña',
  'Create Account': 'Crear Cuenta',
  'Welcome back.': 'Bienvenido de nuevo.',
  'Account created. Check your inbox if email confirmation is enabled.':
    'Cuenta creada. Revisa tu bandeja de entrada si la confirmación está habilitada.',
  'Authentication failed.': 'Autenticación fallida.',
  'Supabase is not configured. Check your .env file.':
    'Supabase no está configurado. Verifica tu archivo .env.',

  // Navigation / Layout
  'Home': 'Inicio',
  'Add': 'Agregar',
  'Categories': 'Categorías',
  'Dashboard': 'Panel',
  'Admin': 'Administrador',
  'Logout': 'Cerrar Sesión',
  'Theme': 'Tema',
  'Language': 'Idioma',
  'Toggle theme': 'Cambiar tema',

  // Dashboard
  "Today's Money": 'El Dinero de Hoy',
  'Track every move with clarity.': 'Rastrea cada movimiento con claridad.',
  'Total Balance': 'Saldo Total',
  'Period Income': 'Ingresos del Período',
  'Period Expenses': 'Gastos del Período',
  'Savings': 'Ahorros',
  'saved in': 'ahorrado en',
  'This Week': 'Esta Semana',
  'This Month': 'Este Mes',
  'This Year': 'Este Año',
  'All Time': 'Todo el Tiempo',
  'Custom Period': 'Período Personalizado',

  // Filters
  'All categories': 'Todas las categorías',
  'This week': 'Esta semana',
  'This month': 'Este mes',
  'This year': 'Este año',
  'All time': 'Todo el tiempo',
  'Custom': 'Personalizado',

  // Transaction list
  'Recent Transactions': 'Transacciones Recientes',
  'Refresh': 'Actualizar',
  'No transactions here': 'No hay transacciones aquí',
  'Add income or expenses to start seeing patterns.':
    'Agrega ingresos o gastos para ver patrones.',
  'Uncategorized': 'Sin categoría',
  'Transaction deleted.': 'Transacción eliminada.',
  'Dashboard updated.': 'Panel actualizado.',
  'Unable to refresh.': 'No se pudo actualizar.',
  'Unable to delete transaction.': 'No se pudo eliminar la transacción.',
  'Showing cached data.': 'Mostrando datos en caché.',

  // Transaction modal
  'Add Transaction': 'Agregar Transacción',
  'Edit Transaction': 'Editar Transacción',
  'Amount': 'Monto',
  'Category': 'Categoría',
  'Payment Method': 'Método de Pago',
  'Date': 'Fecha',
  'Notes': 'Notas',
  'Optional': 'Opcional',
  'Save Transaction': 'Guardar Transacción',
  'Saving…': 'Guardando…',
  'Transaction updated.': 'Transacción actualizada.',
  'Transaction added.': 'Transacción agregada.',
  'Unable to save transaction.': 'No se pudo guardar la transacción.',
  'Create a category first': 'Primero crea una categoría',
  'Card': 'Tarjeta',
  'Cash': 'Efectivo',
  'Bank Transfer': 'Transferencia Bancaria',
  'Wallet': 'Billetera',
  'Other': 'Otro',

  // Confirm modal
  'Delete transaction?': '¿Eliminar transacción?',
  'This action cannot be undone.': 'Esta acción no se puede deshacer.',
  'Cancel': 'Cancelar',
  'Delete': 'Eliminar',

  // Categories page
  'Shape your spending and income labels.': 'Configura tus etiquetas de gastos e ingresos.',
  'Your Categories': 'Tus Categorías',
  'No categories yet': 'Aún no hay categorías',
  'Create your first label to organize transactions.':
    'Crea tu primera etiqueta para organizar transacciones.',
  'Showing cached categories.': 'Mostrando categorías en caché.',
  'Category deleted.': 'Categoría eliminada.',
  'Unable to delete category.': 'No se pudo eliminar la categoría.',

  // Category modal
  'Add Category': 'Agregar Categoría',
  'Edit Category': 'Editar Categoría',
  'Name': 'Nombre',
  'Type': 'Tipo',
  'Color': 'Color',
  'Icon': 'Ícono',
  'Save Category': 'Guardar Categoría',
  'Category updated.': 'Categoría actualizada.',
  'Category created.': 'Categoría creada.',
  'Unable to save category.': 'No se pudo guardar la categoría.',
  'Expense': 'Gasto',
  'Income': 'Ingresos',
  'Delete category?': '¿Eliminar categoría?',
  'Transactions using this category must be reassigned or removed first.':
    'Las transacciones que usan esta categoría deben ser reasignadas o eliminadas primero.',

  // Charts
  'Category Mix': 'Mezcla de Categorías',
  'Trend': 'Tendencia',

  // Admin page
  'User Management': 'Gestión de Usuarios',
  'Overview': 'Resumen',
  'Total Users': 'Total de Usuarios',
  'Total Transactions': 'Total de Transacciones',
  'Total Categories': 'Total de Categorías',
  'User ID': 'ID de Usuario',
  'Transactions': 'Transacciones',
  'Access Denied': 'Acceso Denegado',
  'You are not authorized to view this page.':
    'No estás autorizado para ver esta página.',
  'Loading admin data…': 'Cargando datos de administrador…',
  'Admin note: Full cross-user visibility requires admin RLS policies or a Supabase Edge Function with the service role key.':
    'Nota de administrador: La visibilidad completa entre usuarios requiere políticas RLS de administrador o una Edge Function de Supabase con la clave de rol de servicio.',
  'Your Stats': 'Tus Estadísticas',
  'Expenses': 'Gastos',
  'Balance': 'Saldo',
  'Private spending insights.': 'Perspectivas de gastos privados.',

  // Share & Export
  'Share & Export': 'Compartir y Exportar',
  'Share': 'Compartir',
  'Copy text': 'Copiar texto',
  'Copied!': '¡Copiado!',
  'Preview': 'Vista previa',
  'Top spending': 'Principales gastos',
  'Summary': 'Resumen',
  'Export data': 'Exportar datos',
  'Download CSV': 'Descargar CSV',
  'Download JSON': 'Descargar JSON',
  'Downloading CSV…': 'Descargando CSV…',
  'Downloading JSON…': 'Descargando JSON…',
  'Summary copied to clipboard.': 'Resumen copiado al portapapeles.',
  'savings rate': 'tasa de ahorro',
}

// Dutch translations
const nl = {
  // Brand / Auth
  'Expense Tracker': 'Onkostenregistratie',
  'Private spending insights.': 'Privé bestedingsinzichten.',
  'Login': 'Inloggen',
  'Register': 'Registreren',
  'Email': 'E-mail',
  'Password': 'Wachtwoord',
  'Create Account': 'Account Aanmaken',
  'Welcome back.': 'Welkom terug.',
  'Account created. Check your inbox if email confirmation is enabled.':
    'Account aangemaakt. Controleer je inbox als e-mailbevestiging is ingeschakeld.',
  'Authentication failed.': 'Authenticatie mislukt.',
  'Supabase is not configured. Check your .env file.':
    'Supabase is niet geconfigureerd. Controleer je .env-bestand.',

  // Navigation / Layout
  'Home': 'Thuis',
  'Add': 'Toevoegen',
  'Categories': 'Categorieën',
  'Dashboard': 'Dashboard',
  'Admin': 'Beheerder',
  'Logout': 'Uitloggen',
  'Theme': 'Thema',
  'Language': 'Taal',
  'Toggle theme': 'Thema wisselen',

  // Dashboard
  "Today's Money": 'Het Geld van Vandaag',
  'Track every move with clarity.': 'Volg elke beweging met helderheid.',
  'Total Balance': 'Totaalsaldo',
  'Period Income': 'Periode Inkomen',
  'Period Expenses': 'Periode Uitgaven',
  'Savings': 'Besparingen',
  'saved in': 'gespaard in',
  'This Week': 'Deze Week',
  'This Month': 'Deze Maand',
  'This Year': 'Dit Jaar',
  'All Time': 'Alle Tijd',
  'Custom Period': 'Aangepaste Periode',

  // Filters
  'All categories': 'Alle categorieën',
  'This week': 'Deze week',
  'This month': 'Deze maand',
  'This year': 'Dit jaar',
  'All time': 'Alle tijd',
  'Custom': 'Aangepast',

  // Transaction list
  'Recent Transactions': 'Recente Transacties',
  'Refresh': 'Vernieuwen',
  'No transactions here': 'Geen transacties hier',
  'Add income or expenses to start seeing patterns.':
    'Voeg inkomsten of uitgaven toe om patronen te zien.',
  'Uncategorized': 'Ongecategoriseerd',
  'Transaction deleted.': 'Transactie verwijderd.',
  'Dashboard updated.': 'Dashboard bijgewerkt.',
  'Unable to refresh.': 'Kan niet vernieuwen.',
  'Unable to delete transaction.': 'Kan transactie niet verwijderen.',
  'Showing cached data.': 'Gecachete gegevens worden weergegeven.',

  // Transaction modal
  'Add Transaction': 'Transactie Toevoegen',
  'Edit Transaction': 'Transactie Bewerken',
  'Amount': 'Bedrag',
  'Category': 'Categorie',
  'Payment Method': 'Betaalmethode',
  'Date': 'Datum',
  'Notes': 'Notities',
  'Optional': 'Optioneel',
  'Save Transaction': 'Transactie Opslaan',
  'Saving…': 'Opslaan…',
  'Transaction updated.': 'Transactie bijgewerkt.',
  'Transaction added.': 'Transactie toegevoegd.',
  'Unable to save transaction.': 'Kan transactie niet opslaan.',
  'Create a category first': 'Maak eerst een categorie aan',
  'Card': 'Kaart',
  'Cash': 'Contant',
  'Bank Transfer': 'Bankoverschrijving',
  'Wallet': 'Portemonnee',
  'Other': 'Overige',

  // Confirm modal
  'Delete transaction?': 'Transactie Verwijderen?',
  'This action cannot be undone.': 'Deze actie kan niet ongedaan worden gemaakt.',
  'Cancel': 'Annuleren',
  'Delete': 'Verwijderen',

  // Categories page
  'Shape your spending and income labels.': 'Vorm je uitgaven- en inkomstenlabels.',
  'Your Categories': 'Jouw Categorieën',
  'No categories yet': 'Nog geen categorieën',
  'Create your first label to organize transactions.':
    'Maak je eerste label aan om transacties te organiseren.',
  'Showing cached categories.': 'Gecachete categorieën worden weergegeven.',
  'Category deleted.': 'Categorie verwijderd.',
  'Unable to delete category.': 'Kan categorie niet verwijderen.',

  // Category modal
  'Add Category': 'Categorie Toevoegen',
  'Edit Category': 'Categorie Bewerken',
  'Name': 'Naam',
  'Type': 'Type',
  'Color': 'Kleur',
  'Icon': 'Pictogram',
  'Save Category': 'Categorie Opslaan',
  'Category updated.': 'Categorie bijgewerkt.',
  'Category created.': 'Categorie aangemaakt.',
  'Unable to save category.': 'Kan categorie niet opslaan.',
  'Expense': 'Uitgave',
  'Income': 'Inkomen',
  'Delete category?': 'Categorie Verwijderen?',
  'Transactions using this category must be reassigned or removed first.':
    'Transacties die deze categorie gebruiken moeten eerst worden hertoegewezen of verwijderd.',

  // Charts
  'Category Mix': 'Categoriemix',
  'Trend': 'Trend',

  // Admin
  'User Management': 'Gebruikersbeheer',
  'Overview': 'Overzicht',
  'Total Users': 'Totaal Gebruikers',
  'Total Transactions': 'Totaal Transacties',
  'Total Categories': 'Totaal Categorieën',
  'User ID': 'Gebruikers-ID',
  'Transactions': 'Transacties',
  'Access Denied': 'Toegang Geweigerd',
  'You are not authorized to view this page.':
    'Je bent niet gemachtigd om deze pagina te bekijken.',
  'Loading admin data…': 'Beheergegevens laden…',
  'Admin note: Full cross-user visibility requires admin RLS policies or a Supabase Edge Function with the service role key.':
    'Beheerdersnoot: Volledige zichtbaarheid tussen gebruikers vereist admin RLS-beleid of een Supabase Edge Function met de service-rolsleutel.',
  'Your Stats': 'Jouw Statistieken',
  'Expenses': 'Uitgaven',
  'Balance': 'Saldo',

  // Share & Export
  'Share & Export': 'Delen en Exporteren',
  'Share': 'Delen',
  'Copy text': 'Tekst kopiëren',
  'Copied!': 'Gekopieerd!',
  'Preview': 'Voorbeeld',
  'Top spending': 'Grootste uitgaven',
  'Summary': 'Samenvatting',
  'Export data': 'Gegevens exporteren',
  'Download CSV': 'CSV Downloaden',
  'Download JSON': 'JSON Downloaden',
  'Downloading CSV…': 'CSV downloaden…',
  'Downloading JSON…': 'JSON downloaden…',
  'Summary copied to clipboard.': 'Samenvatting gekopieerd naar klembord.',
  'savings rate': 'spaarrate',
}

const translations = { en: {}, es, nl }

export const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
]

export function useT() {
  const { language } = useApp()
  const dict = translations[language] || {}
  return (key) => dict[key] ?? key
}
