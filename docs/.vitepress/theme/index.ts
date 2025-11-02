import DefaultTheme from 'vitepress/theme'
import './custom.css'

// Components
import ProtomapsSnippet from '../components/ProtomapsSnippet.vue'
import MyProtomapsIndependent from '../components/MyProtomapsIndependent.vue'
import ContactForm from '../components/ContactForm.vue';


export default {
  ...DefaultTheme,

  enhanceApp({ app }) {
    // Regístralos globalmente
    app.component('ProtomapsSnippet', ProtomapsSnippet)
    app.component('MyProtomapsIndependent', MyProtomapsIndependent)
    app.component('ContactForm', ContactForm);
  },
}

