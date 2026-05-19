<script setup lang="ts">
  import { useBotStore } from "@/stores/botStore.ts";
  import { computed, ref } from "vue";
  import { appLocalDataDir, join } from "@tauri-apps/api/path";
  import { writeText } from "@tauri-apps/plugin-clipboard-manager";

  const botStore = useBotStore();

  const activeImage = ref<string | null>(null);
  const deleteImageDialog = ref(false);
  const imageToDelete = ref<string | null>(null);
  const fileInput = ref<HTMLInputElement | null>(null);

  async function handleFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files) return;
    for (let i = 0; i < input.files.length; i++) {
      const file = input.files[i];
      if (file.type.startsWith("image/")) await botStore.addImage(file);
    }
    input.value = "";
  }

  function openDeleteImage(fn: string) {
    imageToDelete.value = fn;
    deleteImageDialog.value = true;
  }

  async function confirmDeleteImage() {
    if (!imageToDelete.value) return;
    await botStore.removeImage(imageToDelete.value);
    deleteImageDialog.value = false;
    imageToDelete.value = null;
    if (activeImage.value === imageToDelete.value) activeImage.value = null;
  }

  function setAsProfile(fn: string) {
    botStore.setProfileImage(
        botStore.currentBot?.profileImage === fn ? undefined : fn,
    );
  }

  async function copyImagesFolderPath() {
    if (!botStore.currentBot) return;

    try {
      const appDir = await appLocalDataDir();
      const botDir = await join(
        appDir,
        "Bot Manager",
        "bots",
        botStore.currentBot.id,
      );
      const imagesDir = await join(botDir, "images");

      await writeText(imagesDir);

      // Optional feedback – uncomment if you have a global notification/snackbar store
      // useNotificationStore().success('Images folder path copied to clipboard!');
    } catch (e) {
      console.error("Failed to copy path:", e);
      // useNotificationStore().error('Failed to copy path');
    }
  }

  const isImagesLoading = computed(() => {
    if (!botStore.currentBot) return false;
    const declaredCount = botStore.currentBot.images?.length ?? 0;
    const loadedCount = Object.keys(botStore.imageUrls).length;
    return loadedCount < declaredCount;
  });
</script>

<template>
  <div class="d-flex flex-column h-100">
    <!-- Hidden file input -->
    <input
        ref="fileInput"
        type="file"
        multiple
        accept="image/*"
        style="display: none"
        @change="handleFileSelect"
    />

    <!-- Header -->
    <div class="pa-4 d-flex justify-space-between align-center border-b">
      <div class="text-h6">Images ({{ botStore.sortedImages.length }})</div>
      <div>
        <v-btn
            icon="mdi-upload"
            size="small"
            variant="outlined"
            color="secondary"
            class="mr-2"
            @click="fileInput?.click()"
        />
        <v-btn
            icon="mdi-folder-outline"
            size="small"
            variant="outlined"
            color="secondary"
            class="mr-2"
            @click="copyImagesFolderPath"
        />
        <v-btn
            color="secondary"
            size="small"
            variant="outlined"
            icon="mdi-sync"
            @click="botStore.syncImagesFromDisk"
            :loading="botStore.loading"
        />
      </div>
    </div>

    <!-- Main split layout -->
    <div class="flex-grow-1 overflow-hidden">
      <v-row no-gutters class="h-100">
        <!-- Thumbnails / Gallery (left on md+, top on mobile) -->
        <v-col cols="12" md="6" class="overflow-y-auto">
          <div class="pa-6">
            <!-- Loading -->
            <div v-if="isImagesLoading" class="text-center py-16">
              <v-progress-circular indeterminate size="64" />
              <p class="mt-6 text-h6">Loading images...</p>
            </div>

            <!-- Thumbnails grid -->
            <div v-else class="d-flex flex-wrap justify-center gap-6">
              <v-card
                  v-for="fn in botStore.sortedImages"
                  :key="fn"
                  width="200"
                  elevation="4"
                  :color="botStore.currentBot?.profileImage === fn ? 'primary' : undefined"
                  class="cursor-pointer transition-all"
                  @click="activeImage = fn"
              >
                <div class="position-relative">
                  <v-img
                      :src="botStore.imageUrls[fn] || '/placeholder-image.png'"
                      height="180"
                      contain
                      class="bg-grey-lighten-2"
                  >
                    <template v-slot:placeholder>
                      <div class="fill-height d-flex align-center justify-center">
                        <v-progress-circular indeterminate />
                      </div>
                    </template>
                  </v-img>

                  <!-- Delete button -->
                  <v-btn
                      icon="mdi-delete"
                      size="small"
                      color="error"
                      class="position-absolute"
                      style="top: 8px; right: 8px"
                      @click.stop="openDeleteImage(fn)"
                  />

                  <!-- Profile star -->
                  <v-btn
                      :icon="botStore.currentBot?.profileImage === fn ? 'mdi-star' : 'mdi-star-outline'"
                      size="small"
                      :color="botStore.currentBot?.profileImage === fn ? 'yellow-darken-2' : ''"
                      class="position-absolute"
                      style="top: 8px; left: 8px"
                      @click.stop="setAsProfile(fn)"
                  />
                </div>

                <v-card-subtitle class="text-center py-2 text-caption">{{ fn }}</v-card-subtitle>
              </v-card>

              <!-- Empty state -->
              <div
                  v-if="!botStore.sortedImages.length"
                  class="text-center text-grey-darken-1 w-100 py-16"
              >
                <v-icon size="100">mdi-image-off</v-icon>
                <p class="mt-6 text-h6">No images yet</p>
                <p class="text-body-1">Upload some images to get started</p>
              </div>
            </div>
          </div>
        </v-col>

        <!-- Preview + details (right on md+, bottom on mobile) -->
        <v-col cols="12" md="6" class="pa-6 d-flex flex-column">
          <!-- Preview image / placeholder -->
          <div class="flex-grow-1 d-flex align-center justify-center bg-grey-lighten-3 rounded-lg">
            <v-img
                v-if="activeImage && botStore.imageUrls[activeImage]"
                :src="botStore.imageUrls[activeImage]"
                max-height="100%"
                max-width="100%"
                contain
                class="rounded-lg"
            />

            <div v-else class="text-center">
              <v-icon size="160" color="grey">mdi-image-search-outline</v-icon>
              <p class="mt-8 text-h5">Select an image to preview</p>
              <p class="text-body-1 text-grey-darken-2">Click any thumbnail on the left</p>
            </div>
          </div>

          <!-- Details (only when image selected) -->
          <div v-if="activeImage" class="mt-6 text-center">
            <p class="text-h6 mb-4">{{ activeImage }}</p>
            <v-btn
                v-if="botStore.currentBot?.profileImage !== activeImage"
                color="primary"
                variant="elevated"
                @click="setAsProfile(activeImage!)"
            >
              Set as Profile Picture
            </v-btn>
            <v-chip v-else color="primary" label class="mt-2">
              Current Profile Picture
            </v-chip>
          </div>
        </v-col>
      </v-row>
    </div>

    <!-- Delete confirmation dialog -->
    <v-dialog v-model="deleteImageDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">Delete Image?</v-card-title>
        <v-card-text>Permanently delete "{{ imageToDelete }}"?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="deleteImageDialog = false">Cancel</v-btn>
          <v-btn color="error" @click="confirmDeleteImage">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.gap-6 > :not(:last-child) {
  margin-bottom: 24px;
  margin-right: 24px;
}
.cursor-pointer {
  cursor: pointer;
}
.transition-all {
  transition: all 0.2s ease;
}
.cursor-pointer:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.15);
}
</style>