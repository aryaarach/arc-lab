export default defineNuxtPlugin((nuxtApp) => {
  let sharedObserver: IntersectionObserver | null = null

  const getObserver = () => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return null
    if (!sharedObserver) {
      sharedObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              const target = entry.target as HTMLElement
              target.classList.add('reveal-visible')
              sharedObserver?.unobserve(target)
            }
          }
        },
        {
          threshold: 0.12,
          rootMargin: '0px 0px -40px 0px'
        }
      )
    }
    return sharedObserver
  }

  nuxtApp.vueApp.directive('reveal', {
    getSSRProps() {
      return {}
    },
    mounted(el: HTMLElement, binding) {
      if (typeof window === 'undefined') return
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (prefersReduced) {
        el.classList.add('reveal-visible')
        return
      }

      const delay = typeof binding.value === 'number' ? binding.value : (binding.value?.delay ?? 0)
      if (delay > 0) {
        el.style.transitionDelay = `${delay}ms`
      }

      el.classList.add('reveal-init')
      const observer = getObserver()
      if (observer) {
        observer.observe(el)
      } else {
        el.classList.add('reveal-visible')
      }
    },
    unmounted(el: HTMLElement) {
      sharedObserver?.unobserve(el)
    }
  })
})
