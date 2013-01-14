AUTO_GEN_DIR          := public/javascripts/auto_generated
STATIC_JS_WITH_DEV    := $(AUTO_GEN_DIR)/avocado.js

all: $(STATIC_JS_WITH_DEV)

clean:
	rm -r $(AUTO_GEN_DIR)

$(AUTO_GEN_DIR):
	mkdir $(AUTO_GEN_DIR)

$(STATIC_JS_WITH_DEV): $(AUTO_GEN_DIR) script/produceStaticJSFile.rb script/load_order.with_dev.rb
	script/produceStaticJSFile.rb < script/load_order.with_dev.rb > $(STATIC_JS_WITH_DEV)
