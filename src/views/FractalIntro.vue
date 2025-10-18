<template>
  <div class="fractal-intro">
    <!-- 开场：引人深思的问题 -->
    <section class="question-hero">
      <div class="question-container">
        <div class="question-mark">?</div>
        <h1 class="question-title">{{ currentQuestion.title }}</h1>
        <p class="question-subtitle">{{ currentQuestion.subtitle }}</p>
        <div class="question-nav">
          <button 
            v-for="(q, index) in questions" 
            :key="index"
            :class="['question-dot', { active: currentQuestionIndex === index }]"
            @click="currentQuestionIndex = index"
          ></button>
        </div>
      </div>
      <div class="scroll-hint">
        <span>向下滚动，寻找答案</span>
        <div class="scroll-arrow">↓</div>
      </div>
    </section>

    <!-- 揭示：Less is More -->
    <section class="revelation-section">
      <div class="container">
        <div class="revelation-content">
          <h2 class="revelation-title">Less is More</h2>
          <div class="revelation-text">
            <p class="big-text">一个简单的公式</p>
            <div class="formula">z = z² + c</div>
            <p class="big-text">创造了整个宇宙</p>
          </div>
          
          <div class="simple-to-complex">
            <div class="evolution-step" v-for="(step, index) in evolutionSteps" :key="index">
              <div class="step-visual" :style="{ animationDelay: index * 0.5 + 's' }">
                <div :class="['shape', step.shape]"></div>
              </div>
              <p class="step-text">{{ step.text }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 思考引导 -->
    <section class="thinking-section">
      <div class="container">
        <div class="thinking-grid">
          <div class="thinking-card" v-for="insight in insights" :key="insight.id">
            <div class="insight-icon">{{ insight.icon }}</div>
            <h3>{{ insight.question }}</h3>
            <p>{{ insight.answer }}</p>
            <div class="insight-visual">
              <div :class="['visual-demo', insight.demo]"></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 自然的分形 -->
    <section class="nature-fractals">
      <div class="container">
        <h2>自然界早已知晓这个秘密</h2>
        <div class="nature-grid">
          <div class="nature-item" v-for="item in natureExamples" :key="item.id">
            <div class="nature-visual">
              <div :class="['nature-shape', item.shape]"></div>
            </div>
            <h4>{{ item.name }}</h4>
            <p>{{ item.description }}</p>
          </div>
        </div>
        <div class="nature-quote">
          <blockquote>
            "大自然用最简单的规则，创造了最复杂的美"
          </blockquote>
        </div>
      </div>
    </section>

    <!-- 邀请探索 -->
    <section class="exploration-invite">
      <div class="container">
        <div class="invite-content">
          <h2>现在，轮到你了</h2>
          <p class="invite-text">
            准备好亲自体验这种从简单到复杂的魔法了吗？<br>
            每一次缩放，每一次迭代，都是一次新的发现。
          </p>
          
          <div class="preview-gallery">
            <div class="preview-item" v-for="preview in previewItems" :key="preview.id">
              <div :class="['preview-visual', preview.type]"></div>
              <span>{{ preview.name }}</span>
            </div>
          </div>
          
          <button class="explore-button" @click="goToExamples">
            <span>开始探索</span>
            <div class="button-ripple"></div>
          </button>
          
          <p class="explore-hint">
            "在无穷中寻找有限，在简单中发现复杂"
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const currentQuestionIndex = ref(0)

const questions = [
  {
    title: "存在无限周长的图形吗？",
    subtitle: "一个有限的面积，却拥有无穷的边界..."
  },
  {
    title: "一条线段能构建整个森林吗？",
    subtitle: "从一根树枝开始，生长出无穷的复杂..."
  },
  {
    title: "什么是真正的无穷？",
    subtitle: "在有限的空间里，隐藏着无限的细节..."
  },
  {
    title: "为什么海岸线的长度是无限的？",
    subtitle: "越仔细测量，越发现其无穷的曲折..."
  }
]

const evolutionSteps = [
  { shape: 'point', text: '一个点' },
  { shape: 'line', text: '一条线' },
  { shape: 'triangle', text: '一个三角形' },
  { shape: 'complex', text: '无穷的复杂' }
]

const insights = [
  {
    id: 1,
    icon: '∞',
    question: '无限周长的图形',
    answer: 'Koch雪花：有限面积，无限周长',
    demo: 'koch-demo'
  },
  {
    id: 2,
    icon: '🌳',
    question: '递归的力量',
    answer: '简单规则重复应用，生成复杂结构',
    demo: 'tree-demo'
  },
  {
    id: 3,
    icon: '🔍',
    question: '自相似性',
    answer: '部分包含整体，整体反映部分',
    demo: 'mandelbrot-demo'
  },
  {
    id: 4,
    icon: '⚡',
    question: '涌现现象',
    answer: '简单相互作用产生复杂行为',
    demo: 'julia-demo'
  }
]

const natureExamples = [
  {
    id: 1,
    name: '树的分支',
    description: '每个分支都是整棵树的缩影',
    shape: 'tree-branch'
  },
  {
    id: 2,
    name: '雪花结晶',
    description: '六角对称中的无穷变化',
    shape: 'snowflake'
  },
  {
    id: 3,
    name: '海岸线',
    description: '曲折的边界，无限的细节',
    shape: 'coastline'
  },
  {
    id: 4,
    name: '云的形状',
    description: '随机中的规律，混沌中的秩序',
    shape: 'cloud'
  }
]

const previewItems = [
  { id: 1, name: 'Mandelbrot集', type: 'mandelbrot' },
  { id: 2, name: 'Julia集', type: 'julia' },
  { id: 3, name: '分形树', type: 'tree' },
  { id: 4, name: 'Koch雪花', type: 'snowflake' }
]

const currentQuestion = computed(() => questions[currentQuestionIndex.value])

// 自动切换问题
onMounted(() => {
  setInterval(() => {
    currentQuestionIndex.value = (currentQuestionIndex.value + 1) % questions.length
  }, 4000)
})

const goToExamples = () => {
  router.push('/fractal-examples')
}
</script>

<style scoped>
.fractal-intro {
  background: #0a0a0a;
  color: white;
  overflow-x: hidden;
}

/* 问题英雄区 */
.question-hero {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  background: radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0a 70%);
}

.question-container {
  text-align: center;
  max-width: 800px;
  padding: 0 2rem;
}

.question-mark {
  font-size: 8rem;
  color: #e94560;
  margin-bottom: 2rem;
  animation: pulse 2s ease-in-out infinite;
}

.question-title {
  font-size: 3rem;
  font-weight: 300;
  margin-bottom: 1.5rem;
  line-height: 1.2;
  transition: all 0.5s ease;
}

.question-subtitle {
  font-size: 1.3rem;
  color: #888;
  font-style: italic;
  margin-bottom: 3rem;
  transition: all 0.5s ease;
}

.question-nav {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 4rem;
}

.question-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #444;
  background: transparent;
  cursor: pointer;
  transition: all 0.3s ease;
}

.question-dot.active {
  background: #e94560;
  border-color: #e94560;
  transform: scale(1.2);
}

.scroll-hint {
  position: absolute;
  bottom: 2rem;
  text-align: center;
  color: #666;
  animation: bounce 2s infinite;
}

.scroll-arrow {
  font-size: 1.5rem;
  margin-top: 0.5rem;
}

/* 揭示区域 */
.revelation-section {
  min-height: 100vh;
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  padding: 5rem 0;
}

.revelation-title {
  font-size: 4rem;
  text-align: center;
  margin-bottom: 3rem;
  background: linear-gradient(45deg, #e94560, #f39c12);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.revelation-text {
  text-align: center;
  margin-bottom: 4rem;
}

.big-text {
  font-size: 2rem;
  margin: 1rem 0;
  color: #ccc;
}

.formula {
  font-size: 3rem;
  font-family: 'Courier New', monospace;
  color: #3498db;
  margin: 2rem 0;
  padding: 1rem;
  border: 2px solid #3498db;
  border-radius: 10px;
  display: inline-block;
  background: rgba(52, 152, 219, 0.1);
}

.simple-to-complex {
  display: flex;
  justify-content: center;
  gap: 3rem;
  flex-wrap: wrap;
}

.evolution-step {
  text-align: center;
}

.step-visual {
  width: 100px;
  height: 100px;
  margin: 0 auto 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeInUp 1s ease forwards;
  opacity: 0;
}

.shape {
  transition: all 0.3s ease;
}

.shape.point {
  width: 8px;
  height: 8px;
  background: #e94560;
  border-radius: 50%;
}

.shape.line {
  width: 60px;
  height: 2px;
  background: #f39c12;
}

.shape.triangle {
  width: 0;
  height: 0;
  border-left: 30px solid transparent;
  border-right: 30px solid transparent;
  border-bottom: 50px solid #3498db;
}

.shape.complex {
  width: 80px;
  height: 80px;
  background: conic-gradient(#e94560, #f39c12, #3498db, #e94560);
  border-radius: 50%;
  animation: rotate 3s linear infinite;
}

/* 思考区域 */
.thinking-section {
  padding: 5rem 0;
  background: #111;
}

.thinking-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
}

.thinking-card {
  background: rgba(255, 255, 255, 0.05);
  padding: 2rem;
  border-radius: 15px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.thinking-card:hover {
  transform: translateY(-10px);
  border-color: #e94560;
  box-shadow: 0 20px 40px rgba(233, 69, 96, 0.2);
}

.insight-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #e94560;
}

.thinking-card h3 {
  color: #f39c12;
  margin-bottom: 1rem;
  font-size: 1.3rem;
}

.insight-visual {
  margin-top: 1.5rem;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.visual-demo {
  width: 100%;
  height: 100%;
  border-radius: 5px;
}

.visual-demo.koch-demo {
  background: linear-gradient(45deg, #3498db, #2ecc71);
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
}

.visual-demo.tree-demo {
  background: linear-gradient(to top, #8B4513, #228B22);
  clip-path: polygon(40% 100%, 45% 80%, 35% 60%, 50% 40%, 65% 60%, 55% 80%, 60% 100%);
}

.visual-demo.mandelbrot-demo {
  background: radial-gradient(circle, #e94560, #1a1a2e);
  border-radius: 50%;
}

.visual-demo.julia-demo {
  background: conic-gradient(#f39c12, #3498db, #e94560, #f39c12);
  border-radius: 50%;
}

/* 自然分形区域 */
.nature-fractals {
  padding: 5rem 0;
  background: linear-gradient(135deg, #16213e 0%, #0f3460 100%);
}

.nature-fractals h2 {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 3rem;
  color: #f39c12;
}

.nature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.nature-item {
  text-align: center;
  padding: 1.5rem;
}

.nature-visual {
  width: 80px;
  height: 80px;
  margin: 0 auto 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nature-shape {
  transition: all 0.3s ease;
}

.nature-shape.tree-branch {
  width: 4px;
  height: 60px;
  background: #8B4513;
  position: relative;
}

.nature-shape.tree-branch::before,
.nature-shape.tree-branch::after {
  content: '';
  position: absolute;
  width: 3px;
  height: 30px;
  background: #228B22;
  top: 10px;
}

.nature-shape.tree-branch::before {
  left: -15px;
  transform: rotate(-30deg);
}

.nature-shape.tree-branch::after {
  right: -15px;
  transform: rotate(30deg);
}

.nature-shape.snowflake {
  width: 60px;
  height: 60px;
  background: #87CEEB;
  clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
}

.nature-shape.coastline {
  width: 70px;
  height: 40px;
  background: #4682B4;
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
}

.nature-shape.cloud {
  width: 70px;
  height: 40px;
  background: #F0F8FF;
  border-radius: 50px;
  position: relative;
}

.nature-shape.cloud::before,
.nature-shape.cloud::after {
  content: '';
  position: absolute;
  background: #F0F8FF;
  border-radius: 50%;
}

.nature-shape.cloud::before {
  width: 30px;
  height: 30px;
  top: -15px;
  left: 10px;
}

.nature-shape.cloud::after {
  width: 40px;
  height: 40px;
  top: -20px;
  right: 5px;
}

.nature-item h4 {
  color: #3498db;
  margin-bottom: 0.5rem;
  font-size: 1.2rem;
}

.nature-quote {
  text-align: center;
  margin-top: 3rem;
}

.nature-quote blockquote {
  font-size: 1.5rem;
  font-style: italic;
  color: #ccc;
  border-left: 4px solid #e94560;
  padding-left: 2rem;
  margin: 0;
  display: inline-block;
}

/* 探索邀请区域 */
.exploration-invite {
  padding: 5rem 0;
  background: #0a0a0a;
  text-align: center;
}

.invite-content h2 {
  font-size: 3rem;
  margin-bottom: 2rem;
  color: #e94560;
}

.invite-text {
  font-size: 1.3rem;
  color: #ccc;
  margin-bottom: 3rem;
  line-height: 1.6;
}

.preview-gallery {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 3rem;
  flex-wrap: wrap;
}

.preview-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.preview-visual {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.preview-visual:hover {
  transform: scale(1.1);
}

.preview-visual.mandelbrot {
  background: radial-gradient(circle, #e94560, #1a1a2e);
}

.preview-visual.julia {
  background: conic-gradient(#f39c12, #3498db, #e94560, #f39c12);
}

.preview-visual.tree {
  background: linear-gradient(to top, #8B4513, #228B22);
}

.preview-visual.snowflake {
  background: linear-gradient(45deg, #87CEEB, #4682B4);
}

.explore-button {
  background: linear-gradient(45deg, #e94560, #f39c12);
  border: none;
  padding: 1.5rem 3rem;
  font-size: 1.3rem;
  font-weight: 600;
  color: white;
  border-radius: 50px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  margin-bottom: 2rem;
}

.explore-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 15px 30px rgba(233, 69, 96, 0.4);
}

.button-ripple {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.explore-button:active .button-ripple {
  width: 300px;
  height: 300px;
}

.explore-hint {
  font-style: italic;
  color: #666;
  font-size: 1.1rem;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* 动画 */
@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
}

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
  from {
    opacity: 0;
    transform: translateY(20px);
  }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .question-title {
    font-size: 2rem;
  }
  
  .revelation-title {
    font-size: 2.5rem;
  }
  
  .big-text {
    font-size: 1.5rem;
  }
  
  .formula {
    font-size: 2rem;
  }
  
  .simple-to-complex {
    gap: 1.5rem;
  }
  
  .thinking-grid {
    grid-template-columns: 1fr;
  }
  
  .nature-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .preview-gallery {
    gap: 1rem;
  }
}

@media (max-width: 480px) {
  .question-mark {
    font-size: 5rem;
  }
  
  .question-title {
    font-size: 1.5rem;
  }
  
  .nature-grid {
    grid-template-columns: 1fr;
  }
  
  .container {
    padding: 0 1rem;
  }
}
</style>