<template>
  <v-container fluid class="fill-height pa-0">
    <v-row class="fill-height" align="center" justify="center" no-gutters>
      <v-col cols="12" md="8" lg="6" class="text-center">
        <!-- Large friendly robot icon -->
        <v-icon size="240" color="primary" class="mb-8">
          mdi-robot-confused
        </v-icon>

        <!-- 404 heading -->
        <div
          class="text-h1 font-weight-thin mb-4"
          style="letter-spacing: 0.05em"
        >
          404
        </div>

        <!-- Friendly message -->
        <h2 class="text-h4 mb-4">Oops! Page Not Found</h2>
        <p class="text-h6 text-medium-emphasis mb-8 px-4">
          Looks like this bot took a wrong turn in the digital universe.<br />
          Don't worry — the page you're looking for might be on a coffee break.
        </p>

        <!-- Action buttons -->
        <div
          class="d-flex flex-column flex-sm-row gap-4 justify-center align-center"
        >
          <v-btn
            color="primary"
            size="x-large"
            prepend-icon="mdi-home"
            to="/"
            variant="elevated"
          >
            Return Home
          </v-btn>
          <v-btn @click="$router.back()" size="x-large" variant="outlined">
            Go Back
          </v-btn>
        </div>

        <!-- Optional fun footer -->
        <p class="text-body-1 text-medium-emphasis mt-12">
          If you think this is a mistake, try refreshing or check the URL.
        </p>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
// No script needed – simple static page
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
  background: linear-gradient(
    135deg,
    var(--v-theme-background) 0%,
    var(--v-theme-surface) 100%
  );
}
</style>
