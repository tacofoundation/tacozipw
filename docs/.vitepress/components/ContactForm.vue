<template>
  <section class="my-protomaps-snippet">
    <div class="text-content">
      <h2 class="big-title">Contact Us</h2>
      <h3 class="subbig-title">Drop me a line</h3>
      <div class="content-wrapper">
        <div class="form-wrapper">
          <form @submit.prevent="handleSubmit" class="contact-form">
            <div>
              <label for="name">Name</label>
              <input type="text" id="name" v-model="formData.name" required />
            </div>
            <div>
              <label for="subject">Subject</label>
              <input type="text" id="subject" v-model="formData.subject" required />
            </div>
            <div>
              <label for="email">Your Email</label>
              <input type="email" id="email" v-model="formData.email" required />
            </div>
            <div>
              <label for="message">Message</label>
              <textarea id="message" v-model="formData.message" required></textarea>
            </div>
            <button type="submit">Send</button>
          </form>
        </div>
        <div class="logo-wrapper">
          <!-- <p class="aaaa" style="font-size: 1.8rem; text-align: left;">Created with &#x2764;&#xfe0f at:</p> -->
          <img src="./../../public/logo_isp_cn_fondo-modified.png" alt="">
          <p style="color: #33646e"> <span style="color: var(--vp-isp);">ISP ·</span> Image & Signal Processing</p>
          <p style="color: #479bb0">Universitat de València</p>
          <!-- <p style="font-size: 1.5rem">Created with &#x2764;&#xfe0f at ISP Valencia University.</p> -->
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  data() {
    return {
      formData: {
        name: '',
        subject: '',
        email: '',
        message: ''
      }
    };
  },
  methods: {
    handleSubmit() {
      // Construir el enlace mailto
      const emailTo = "csaybar@gmail.com"; // Dirección de correo de destino
      const subject = encodeURIComponent(this.formData.subject);
      const body = encodeURIComponent(
        `Name: ${this.formData.name}\nEmail: ${this.formData.email}\n\nMessage:\n${this.formData.message}`
      );
      
      // Crear el enlace mailto
      const mailtoLink = `mailto:${emailTo}?subject=${subject}&body=${body}`;
      
      // Abrir el cliente de correo
      window.location.href = mailtoLink;
    }
  }
};
</script>

<style>
@import url('https://fonts.cdnfonts.com/css/twentieth-century-for-kenmore');
</style>
